import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 30 }); // 30sec
export default cache;