export default class Bank {
    id!: number;
    name!: string;
    async add(a: number, b: number) {
        return {
            sum: a + b,
        };
    }
}
