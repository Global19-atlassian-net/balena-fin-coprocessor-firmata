# BalenaFin Co-Processor Firmata [![build](https://img.shields.io/badge/release-beta-brightgreen.svg)]()

This is an implementation of the [Firmata](https://github.com/firmata/protocol) protocol for Silicon Labs BGM111. It is compatible with standard Firmata 2.5.8. 
Please be aware this **project is in beta release** and is subject to change frequently.

## Installation

### Dockerfile

The easiest way to install the Firmata application onto your board is to run the [balena application](https://github.com/balena-io-playground/balena-fin-firmata-flash) provided. This targets the latest verision of the Balena Firmata application. 
This balena application will run and install [OpenOCD](http://openocd.org/) on your Fin in order to provision the Coprocessor with both a bootloader and the Firmata application.

### Build & Manually Flash

It is also possible to build the source and manually flash the Coprocessor however, in order to flash the Coprocessor you will need to either load the compiled firmware onto the Compute Module and flash it using OpenOCD or program the Coprocessor using an external programmer such as a [Segger JLink ](https://www.segger.com/products/debug-probes/j-link/).

### Dependencies

 - cmake
 - make
 - arm-none-eabi-gcc*

If using a JLink programmer to externally flash:

 - [JLink tools](https://www.segger.com/jlink-software.html)

> :wrench: * Make sure this is in your `$PATH`

### Building/Flashing

With the dependencies installed, run:

1. `make setup` to generate the build directory
2. `make balena` to execute the build*

If using a JLink programmer to externally flash:

3. `make flash` to flash to a device

> :wrench: * `make devkit` can be used to build for the Silabs BRD4001A development kit

## Firmata Protocol v2.5.8

| type                  | command | MIDI channel | first byte          | second byte     | support              |
| --------------------- | ------- | ------------ | ------------------- | --------------- | -------------------- |
| analog I/O message    | 0xE0    | pin #        | LSB(bits 0-6)       | MSB(bits 7-13)  |          ✅          |
| digital I/O message   | 0x90    | port         | LSB(bits 0-6)       | MSB(bits 7-13)  |          ✅          |
| report analog pin     | 0xC0    | pin #        | disable/enable(0/1) | - n/a -         |          ✅          |
| report digital port   | 0xD0    | port         | disable/enable(0/1) | - n/a -         |          ✅          |
|                       |         |              |                     |                 |                      |
| start sysex           | 0xF0    |              |                     |                 |          ✅          |
| set pin mode(I/O)     | 0xF4    |              | pin # (0-127)       | pin mode        |          ✅          |
| set digital pin value | 0xF5    |              | pin # (0-127)       | pin value(0/1)  |          ✅          |
| sysex end             | 0xF7    |              |                     |                 |          ✅          |
| protocol version      | 0xF9    |              | major version       | minor version   |          ✅          |
| system reset          | 0xFF    |              |                     |                 |          ✅          |

Sysex-based sub-commands (0x00 - 0x7F) are used for an extended command set.

| type                  | sub-command | first byte       | second byte     | ...             | support             |
| --------------------- | -------     | ---------------  | --------------- | --------------- | --------------------|
| string                | 0x71        | char *string ... |                 |                 |          ✅          |
| firmware name/version | 0x79        | major version    | minor version   | char *name ...  |          ✅          |
| I2C command           | 0x76        | See [I2C](#Firmata-I2C-SYSEX-Commands)    | See [I2C](#Firmata-I2C-SYSEX-Commands)   | See [I2C](#Firmata-I2C-SYSEX-Commands)  |          ✅          |
| balena subcommand     | 0x0B        | subcommand       | see subcommands | see subcommands |          ✅          |

### Firmata SYSEX I2C Commands

I2C R/W request and reply are implemented following the [official protocol](https://github.com/firmata/protocol/blob/master/i2c.md).

#### I2C Config

Optional `Delay` is for I2C devices that require a delay between when the register is written to and the data in that register can be read.

Optional `I2C Mode` allows for changing the I2C interface from the balenaFin's internal pins (SCL 18 & SDA 19) and the external interface (SCL 12 & SDA 10).

```
0  START_SYSEX (0xF0)
1  I2C_CONFIG (0x78)
2  Delay in microseconds (LSB) [optional]
3  Delay in microseconds (MSB) [optional]
4  I2C Mode (LSB) [optional]
5  I2C Mode (MSB) [optional]
n  END_SYSEX (0xF7)
```

### Firmata SYSEX Balena Commands

Balena SYSEX subcommands are structured under the Firmata SYSEX command. 

For example a balena subcommand to report balena firmata firmware would be represented as follows:

`[0xF0, 0x0B, 0x00, 0xF7]`

Which represents:

`[START_SYSEX, BALENA_SUBCOMMAND, BALENA_REPORT_FIRMWARE, END_SYSEX]`

| type                   | sub-command | first byte         | second byte             | ...                     | support |
| ---------------------- | ----------- | ------------------ | ----------------------- | ----------------------- | ------- |
| report balena firmware | 0x00        |                    |                         |                         |  ✅     |
| power down             | 0x01        | uint8_t init_delay | uint8_t sleep_period[0] | uint8_t sleep_period[3] |  ✅     |

#### Report balena Firmware

While the SYSEX command `0x79` reports the protocol version of firmata, the SYSEX balena subcommand reports the specific version of firmware that the coprocessor is running. 

#### Power Down

This SYSEX command performs a hard power down of the CM3. In order to prevent loss of data or other hard shutdown consequences, users should set an `init_delay` period and gracefully power down the CM3 from the linux userspace, i.e. with `shutdown -h now`. 
After the `sleep_period` has expired, the coprocessor will resume power to the CM3 allowing it to boot into normal operating mode.

- `init_delay` is composed of **1 byte**, specified in seconds (passing 0 will immediate power down the CM3 and is not recommended!)
- `sleep_period` is composed of **4 bytes**, specified in seconds (max value of (`uint32_t` / 1000), eqv. of ~4294967 seconds)

## Firmata Pin Map

| Pin | Port | Function              | Note                 |
|-----|------|-----------------------|----------------------|
| 0   | PD14 |                       |                      |
| 1   | PB13 | SPI_CS                |                      |
| 2   | PA2  |                       |                      |
| 3   | PC8  | SPI_CLK               |                      |
| 4   | PA3  |                       |                      |
| 5   | PC6  | SPI_MOSI              |                      |
| 6   | PA4  |                       |                      |
| 7   | PC7  | SPI_MISO              |                      |
| 8   | PA5  |                       |                      |
| 9   | PA1  |                       |                      |
| 10  | PB11 | I2C_SDA (external)    |                      |
| 11  | PA0  |                       |                      |
| 12  | PF6  | I2C_SCL (external)    |                      |
| 13  | PD15 |                       |                      |
| 14  | PF7  |                       |                      |
| 15  | PD13 |                       |                      |
| 16  | PF5  | PW_ON_3V3             | balenaFin Power Rail |
| 17  | PC9  | PW_ON_5V              |                      |
| 18  | PC10 | I2C_SDA (internal)    |                      |
| 19  | PC11 | I2C_SCL (internal)    |                      |

## Currently Unsupported

- [ ] SPI Support
- [ ] Analogue Read/Write*

> :warning: ***Analogue Write**: Due to the BGM111 implementing an IDAC instead of the typical DAC for analogue output

