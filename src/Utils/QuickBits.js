class QuickBits { // Not sponsored by LMG

    static toBitArr(intVal) {
        var bitArr = [];
        for (var i = 0; i < 32; i++) {
            bitArr.push(intVal & 1);
            intVal = intVal >> 1;
        }
        return bitArr;
    }
}

// 239 in hex is 


module.exports = QuickBits;