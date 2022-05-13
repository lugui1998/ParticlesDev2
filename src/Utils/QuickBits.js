class QuickBits { // Not sponsored by LMG

    static toBitArr(intVal) {
        var bitArr = [];
        for (var i = 0; i < 32; i++) {
            bitArr.push(intVal & 1);
            intVal = intVal >> 1;
        }
        return bitArr;
    }

    static Int16ToUInt8Arr(intVal) {
        // takes a signed Int16 and returns 2 Unsigned Int8s
        var arr = [0, 0];
        arr[0] = intVal >> 8;
        arr[1] = intVal & 0xFF;
        return arr;
    }


    static UInt8ToInt16(a, b) {
        // convert 2 hex values into an Int16
        const value = ((a << 8) | b);
        return value;
    }

}

// 239 in hex is 


module.exports = QuickBits;