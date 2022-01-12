import { Connection, createConnection } from "typeorm";

import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import request from "supertest";

import authConfig from "../../../../config/auth";
import { UsersRepository } from "@modules/users/repositories/UsersRepository";
import { StatementsRepository } from "../../repositories/StatementsRepository";
import { app } from "../../../../app";
import { User } from "../../../users/entities/User";

let connection: Connection;
let token: string;
let senderUser: User;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Get Statement Operation", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const usersRepository = new UsersRepository();

    senderUser = await usersRepository.create({
      email: "test@sender.com",
      name: "User test 2",
      password: await hash("test", 8),
    });

    const { secret, expiresIn } = authConfig.jwt;

    token = sign({ senderUser }, secret, {
      subject: senderUser.id,
      expiresIn,
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to get a statement", async () => {
    const statementsRepository = new StatementsRepository();

    const statement = await statementsRepository.create({
      amount: 100,
      description: "test 1",
      type: "withdraw" as OperationType,
      user_id: senderUser.id,
    });

    const response = await request(app)
      .get(`/api/v1/statements/${statement.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send();

    expect(response.status).toBe(200);
    expect({
      ...response.body,
      amount: Number(response.body.amount),
      created_at: new Date(response.body.created_at),
      updated_at: new Date(response.body.updated_at),
    }).toEqual(statement);
  });

  it("Should not be able to get a statement from a non-existing user", async () => {
    const statementsRepository = new StatementsRepository();

    const statement = await statementsRepository.create({
      amount: 400,
      description: "test 1",
      type: "withdraw" as OperationType,
      user_id: senderUser.id,
    });
    const { secret, expiresIn } = authConfig.jwt;

    const fakeId = uuidv4();
    const fakeToken = sign({}, secret, {
      subject: fakeId,
      expiresIn,
    });

    const response = await request(app)
      .get(`/api/v1/statements/${statement.id}`)
      .set({
        Authorization: `Bearer ${fakeToken}`,
      })
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "User not found",
    });
  });

  it("Should not be able to get a non-existing statement", async () => {
    const fakeId = uuidv4();

    const response = await request(app)
      .get(`/api/v1/statements/${fakeId}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "Statement not found",
    });
  });
});
