import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from "typeorm";

export class AlterTableInsertSenderId1643373987996
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      "statements",
      "type",
      new TableColumn({
        name: "type",
        type: "enum",
        enum: ["deposit", "withdraw", "transfer"],
      })
    );

    await queryRunner.addColumn(
      "statements",
      new TableColumn({
        name: "sender_id",
        type: "uuid",
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      "statements",
      new TableForeignKey({
        name: "statementsSenderIdFK",
        columnNames: ["sender_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey("statements", "sender_id");
    await queryRunner.dropColumn("statements", "sender_id");
    await queryRunner.changeColumn(
      "statements",
      "type",
      new TableColumn({
        name: "type",
        type: "enum",
        enum: ["deposit", "withdraw"],
      })
    );
  }
}
