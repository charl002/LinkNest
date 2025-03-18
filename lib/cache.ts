import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60 }); // 10mins cache
export default cache;