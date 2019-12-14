import { Observable, of, from, concat } from "rxjs";
import * as yaml from 'yamljs'
import * as fs from 'fs'
import { map, pluck, shareReplay, concatMap, mergeMap, tap } from 'rxjs/operators'
import { NacosConfigClient } from "nacos";
import { zip } from "rxjs";
import ConfigInterface from "./interfaces/config.interface"
import fromPairs = require("lodash/fp/fromPairs");
import _map = require('lodash/fp/map');
import join = require("lodash/fp/join")
import compose = require("lodash/fp/compose")
import reverse = require("lodash/fp/reverse")
import * as ph from 'path'
import j2i from 'json-to-ts'
export interface NacosOption {
    address: string;
    port: number;
    group: string;
    namespace: string;
    name: string;
}

enum SimpleType {
    Array = 1,
    Object,
    Other
}
export type env = 'develop' | 'production' | 'test'
export class config {
    private option$: Observable<NacosOption> = config.getNacosOption(this.option);
    private client$: Observable<NacosConfigClient> = this.option$.pipe(map(config.createNacosClient), shareReplay(1));
    private nacosConfig$: Observable<Partial<ConfigInterface>> = zip(this.client$, this.option$).pipe(mergeMap(([client, option]) => config.getNacosConfig(client, option)))
    private localConfig$: Observable<Partial<ConfigInterface>> = typeof this.option === 'string' ? config.getLocalConfig(this.option) : of({} as any)
    private config$: Observable<Partial<ConfigInterface>> = zip(this.nacosConfig$, this.localConfig$).pipe(map(([nacos, local]) => ({ ...nacos, ...local } as any)));
    private config: Partial<ConfigInterface>;
    private configMap: ConfigInterface;
    private constructor(private option: string | NacosOption) { }
    private init = async () => {
        await this.config$.pipe(tap(this.build)).toPromise();
        return this;
    }
    static create(path?: string) {
        const dir = __dirname.includes('node_modules') ? __dirname.split('node_modules').shift() : __dirname
        return new config(path || ph.resolve(`${dir}/config.${process.env.NODE_ENV || 'dev'}.yaml`)).init()
    }
    private build = (conf: Partial<ConfigInterface>) => {
        this.config = conf;
        this.configMap = config.createConfigInterface(conf);
        const text = this.buildInterface(this.configMap);
        const targetPath = __dirname + "/interfaces/config.interface.d.ts";
        if (fs.readFileSync(targetPath).toString() !== text) {
            fs.writeFileSync(__dirname + "/interfaces/config.interface.d.ts", text)
        }
        config.resetConfigD();
        return this.configMap;
    }
    private static getNacosOption = (option: string | NacosOption) =>
        typeof option === 'string' ? config.getLocalConfig(option).pipe(pluck('nacos'), shareReplay(1)) : of(option)
    private static getLocalConfig = (path: string) => {
        if (fs.existsSync(path)) return of(fs.readFileSync(path).toString()).pipe(map(config.yaml2Json), shareReplay(1)) as Observable<Partial<ConfigInterface>>
        else throw new Error(`config[${path}] not found`)
    }
    private static yaml2Json = (str: string) =>
        yaml.parse(str);
    private static createNacosClient = (option: NacosOption) =>
        new NacosConfigClient({
            serverAddr: `${option.address}:${option.port}`,
            namespace: option.namespace
        })
    private static getNacosConfig = (client: NacosConfigClient, option: NacosOption) =>
        from(client.getConfig(option.name, option.group)).pipe(map(config.yaml2Json)) as Observable<Partial<ConfigInterface>>
    private static createConfigInterface = (conf: Partial<ConfigInterface>) =>
        (fromPairs)(config.toEntries(JSON.parse(JSON.stringify(conf)))) as unknown as ConfigInterface
    private static toEntries = (obj: any, type: SimpleType = SimpleType.Object, parent: string = null) => {
        if (type === SimpleType.Other) return [];
        const getKey = (key: string, type: SimpleType) => `${parent ? `${parent}.` : ''}${type === SimpleType.Array ? `[${key}]` : key}`
        const getType = (val: any) => typeof val === 'object' ? val instanceof Array ? SimpleType.Array : SimpleType.Object : SimpleType.Other
        const map = parent === null ? Object.entries(obj) : Object.entries(obj).map(([key, val]) => [getKey(key, type), val]);
        const tmp = [];
        for (const [key, target] of map) {
            const _type = getType(target)
            if (_type !== SimpleType.Other) {
                tmp.push(...config.toEntries(target, _type, key as string))
            }
        }
        return [...map, ...tmp]
    }
    private buildInterface = compose(join("\n"), reverse, _map((s: string) =>
        `${s.indexOf('RootObject') >= 0 ? "export default" : "export"} ${s}`
    ), j2i)
    private static resetConfigD = () => {
        const confStr = fs.readFileSync(__dirname + "/config.d.ts").toString();
        const targetStr = 'KEY extends string | number';
        if (confStr.indexOf(targetStr) > 0) {
            const text = confStr.replace(targetStr, 'KEY extends keyof ConfigInterface');
            fs.writeFileSync(__dirname + "/config.d.ts", text);
        }
    }
    public get = <KEY extends keyof ConfigInterface>(key: KEY): ConfigInterface[KEY] => {
        return this.configMap[key]
    }
}