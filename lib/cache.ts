import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5mins
export default cache;