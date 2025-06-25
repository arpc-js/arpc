import Account from "./Account";

export default class Profile {
    id!: number;
    name!: string;
    account!: Account;
    async add(a: number, b: number) {
        console.log(a+b)
        return {
            sum: a + b,
        };
    }
}
