const Sandbox = require('./Sandbox');

const sandboxArea = document.getElementById('sandboxArea');

const rows = sandboxArea.offsetHeight;
const columns = sandboxArea.offsetWidth;


const workerCount = 4;
const sandbox = new Sandbox(sandboxArea, workerCount);

