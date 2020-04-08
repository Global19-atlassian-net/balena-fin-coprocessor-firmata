let firmata = require('firmata')
const port = "/dev/ttyUSB1";

const mcp4725 = 0x60;
const register = {
    WRITE: 0x40,
    READ: 0xc3,
};

let board = new firmata.Board(port, {skipCapabilities: true},function(err) {
    if (err) {
        console.log(err);
        board.reset();
    return;
    }
});

board.on("ready", () => {
    console.log("Ready");
    console.log('board.firmware: ', board.firmware);

    const target = 2857; // See testbot calculation for target value
    const dut_pw_en = 14;

    board.pinMode(dut_pw_en, board.MODES.OUTPUT);
    board.i2cConfig(0);

    board.i2cWrite(mcp4725, register.WRITE, [target >> 4, (target & 0x0F) << 4]);
    console.log("DAC Value Write: ", target);

    board.digitalWrite(dut_pw_en, 1); // Enable DUT power

    board.i2cRead(mcp4725, register.READ, 3, data => {
        const output = (data[1] << 4) | (data[2] >> 4);
        console.log("DAC Value Read: ", output);
    });
});