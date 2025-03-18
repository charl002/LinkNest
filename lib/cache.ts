import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 900 }); // 15mins cache
export default cache;