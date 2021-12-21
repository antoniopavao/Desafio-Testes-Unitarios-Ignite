import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { CreateStatementError } from "../createStatement/CreateStatementError";
import { GetBalanceUseCase } from "../getBalance/GetBalanceUseCase";
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let getBalanceUseCase: GetBalanceUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Create Deposit statement", () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
    getBalanceUseCase = new GetBalanceUseCase(
      inMemoryStatementsRepository,
      inMemoryUsersRepository
    );
  });

  it("Should be able to withdraw", async () => {
    const user = await createUserUseCase.execute({
      name: "User test",
      email: "user@example.com",
      password: "password",
    });

    const deposit = {
      user_id: user.id,
      type: OperationType.DEPOSIT,
      amount: 500,
      description: "College",
    };

    const withdraw = {
      user_id: user.id,
      type: OperationType.WITHDRAW,
      amount: 400,
      description: "College",
    };

    await createStatementUseCase.execute(deposit);
    await createStatementUseCase.execute(withdraw);

    const balance = await getBalanceUseCase.execute({ user_id: user.id });

    expect(balance).toHaveProperty("balance");
    expect(balance.balance).toEqual(100);
  });

  it("Should not be able to withdraw if the user does not have enough funds", () => {
    expect(async () => {
      const user = await createUserUseCase.execute({
        name: "User test",
        email: "user@example.com",
        password: "password",
      });

      const deposit = {
        user_id: user.id,
        type: OperationType.DEPOSIT,
        amount: 500,
        description: "Test",
      };

      await createStatementUseCase.execute(deposit);

      await createStatementUseCase.execute({
        user_id: user.id,
        amount: 600,
        description: "test withdraw",
        type: OperationType.WITHDRAW,
      });
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });
});
