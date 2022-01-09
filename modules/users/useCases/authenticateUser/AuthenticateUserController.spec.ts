import { Connection } from "typeorm";
import request from "supertest";
import { hash } from "bcryptjs";
import { verify } from "jsonwebtoken";
import createConnection from "../../../../database/index";

import { app } from "../../../../app";

import authConfig from "../../../../config/auth";

import { UsersRepository } from "../../repositories/UsersRepository";

let connection: Connection;

describe("Authenticate User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to authenticate a existing user ans return a valid jwt token", async () => {
    const usersRepository = new UsersRepository();

    const user = await usersRepository.create({
      name: "Test",
      email: "teste@teste.com",
      password: await hash("12345", 8),
    });

    const response = await request(app).post("/api/v1/sessions").send({
      email: "teste@teste.com",
      password: "12345",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: expect.any(String),
    });

    expect(() => {
      verify(response.body.token, authConfig.jwt.secret);
    }).not.toThrowError();
  });

  it("Should not be able to authenticate user with wrong password", async () => {
    const usersRepository = new UsersRepository();
    await usersRepository.create({
      name: "Test2",
      email: "teste2@teste.com",
      password: await hash("12345", 8),
    });

    const response = await request(app).post("/api/v1/sessions").send({
      email: "teste2@teste.com",
      password: "54321",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      message: "Incorrect email or password",
    });
  });
});
