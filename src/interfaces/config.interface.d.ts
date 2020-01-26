export interface Redis {
  host: string;
}
export default interface RootObject {
  redis: Redis;
  'redis.host': string;
}