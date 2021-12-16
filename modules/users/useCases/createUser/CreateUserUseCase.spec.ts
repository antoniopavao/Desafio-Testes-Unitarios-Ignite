import { AppError } from "@shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";

let createUserUseCase: CreateUserUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;

describe("Create user", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
  });
  it("Should be able to create users", async () => {
    const user = await createUserUseCase.execute({
      name: "Antonio Araujo",
      email: "antonioppavao@gmail.com",
      password: "senha456",
    });

    expect(user).toHaveProperty("id");
  });

  it("Should not be able to create user if user already exists", () => {
    expect(async () => {
      await createUserUseCase.execute({
        name: "Antonio Araujo",
        email: "antonioppavao@gmail.com",
        password: "senha456",
      });

      await createUserUseCase.execute({
        name: "Antonio Araujo",
        email: "antonioppavao@gmail.com",
        password: "senha456",
      });
    }).rejects.toBeInstanceOf(CreateUserError);
  });
});
