import {OdbBase} from "../core/OdbBase.ts";

export class Spu extends OdbBase<Spu>{
    id:bigint
    name:string
    src:string
    price:number
    old_price:number
    sells:number
    timespan:number
    info_src:string
}
