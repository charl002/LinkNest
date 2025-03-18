import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10mins cache
export default cache;