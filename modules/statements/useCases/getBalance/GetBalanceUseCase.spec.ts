import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { AppError } from "@shared/errors/AppError";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let getBalanceUseCase: GetBalanceUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Get user balance", () => {
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

  it("Should be able to show user balance", async () => {
    const user = await createUserUseCase.execute({
      name: "Test User",
      email: "test@example.com",
      password: "test",
    });

    const statement = {
      user_id: user.id,
      type: OperationType.DEPOSIT,
      amount: 1000,
      description: "Study",
    };

    await createStatementUseCase.execute(statement);
    const balance = await getBalanceUseCase.execute({ user_id: user.id });

    expect(balance).toHaveProperty("balance");
    expect(balance.balance).toEqual(1000);
  });

  it("Should not be able to show user balance if user is not authenticated", () => {
    expect(async () => {
      await getBalanceUseCase.execute({ user_id: "abc1234" });
    }).rejects.toBeInstanceOf(GetBalanceError);
  });
});
