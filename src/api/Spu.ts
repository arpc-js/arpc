import {Base} from "../core/Base.ts";

export class Spu extends Base<Spu>{
    id:bigint
    name:string
    src:string
    price:number
    old_price:number
    sells:number
    timespan:number
    info_src:string
}
