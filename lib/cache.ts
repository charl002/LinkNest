import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 30 }); // 5mins
export default cache;