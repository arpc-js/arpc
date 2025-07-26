import {ArBase,prop,menu} from "../core/ArBase.ts"

@menu({"name":"test","parent":"test"})        
export class Test extends ArBase{
    @prop({"tag":"name"})
    name: string;
    @prop({"tag":"age"})
    age: number;
}