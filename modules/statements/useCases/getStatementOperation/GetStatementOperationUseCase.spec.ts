import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { CreateStatementError } from "../createStatement/CreateStatementError";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let getStatementOperationUseCase: GetStatementOperationUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Get statement", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
  });

  it("Should be able to get statement", async () => {
    const user = await createUserUseCase.execute({
      name: "user test",
      email: "user@example.com",
      password: "password",
    });

    const deposit = {
      user_id: user.id,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "College",
    };

    const operation = await createStatementUseCase.execute(deposit);

    const statement = await getStatementOperationUseCase.execute({
      user_id: user.id,
      statement_id: operation.id,
    });

    expect(statement).toHaveProperty("id");
    expect(statement.user_id).toEqual(operation.user_id);
  });

  it("Should not be able to get invalid/ non existent statements", async () => {
    const userData = {
      name: "User test",
      email: "user@example.com",
      password: "password",
    };

    const user = await createUserUseCase.execute(userData);

    await expect(
      getStatementOperationUseCase.execute({
        user_id: user.id,
        statement_id: "Fake statement",
      })
    ).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
  });

  it("Should not be able to get statement if user does not exist", () => {
    expect(async () => {
      await getStatementOperationUseCase.execute({
        user_id: "Fake User ID",
        statement_id: "statement fake",
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
  });
});
