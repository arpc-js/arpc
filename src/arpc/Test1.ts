import {ArBase,prop,menu} from "../core/ArBase.ts"

@menu({"name":"test","parent":"test"})        
export class Test1 extends ArBase{
    @prop({"tag":"name"})
    name: string;
}