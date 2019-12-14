export interface Route {
  id: string;
  uri: string;
  predicates: string[];
}
export interface Gateway {
  routes: Route[];
}
export interface Cloud {
  gateway: Gateway;
}
export interface Spring {
  cloud: Cloud;
}
export interface Nacos {
  address: string;
  port: number;
  group: string;
  namespace: string;
  name: string;
}
export default interface RootObject {
  spring: Spring;
  nacos: Nacos;
  'spring.cloud': Cloud;
  'spring.cloud.gateway': Gateway;
  'spring.cloud.gateway.routes': Route[];
  'spring.cloud.gateway.routes.[0]': Route;
  'spring.cloud.gateway.routes.[1]': Route;
  'spring.cloud.gateway.routes.[2]': Route;
  'spring.cloud.gateway.routes.[0].id': string;
  'spring.cloud.gateway.routes.[0].uri': string;
  'spring.cloud.gateway.routes.[0].predicates': string[];
  'spring.cloud.gateway.routes.[0].predicates.[0]': string;
  'spring.cloud.gateway.routes.[1].id': string;
  'spring.cloud.gateway.routes.[1].uri': string;
  'spring.cloud.gateway.routes.[1].predicates': string[];
  'spring.cloud.gateway.routes.[1].predicates.[0]': string;
  'spring.cloud.gateway.routes.[2].id': string;
  'spring.cloud.gateway.routes.[2].uri': string;
  'spring.cloud.gateway.routes.[2].predicates': string[];
  'spring.cloud.gateway.routes.[2].predicates.[0]': string;
  'nacos.address': string;
  'nacos.port': number;
  'nacos.group': string;
  'nacos.namespace': string;
  'nacos.name': string;
}