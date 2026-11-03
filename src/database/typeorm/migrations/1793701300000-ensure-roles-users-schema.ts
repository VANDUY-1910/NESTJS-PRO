import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureRolesUsersSchema1793701300000 implements MigrationInterface {
  name = 'EnsureRolesUsersSchema1793701300000';

  private readonly marker = 'nestjs-pro:EnsureRolesUsersSchema1793701300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rolesExisted = await this.tableExists(queryRunner, 'roles');
    const usersExisted = await this.tableExists(queryRunner, 'users');

    if (rolesExisted !== usersExisted) {
      throw new Error(
        'Cannot ensure roles/users schema because only one of public.roles and public.users exists. No schema changes were made.',
      );
    }

    if (rolesExisted) {
      const roleCount = await queryRunner.query(
        'SELECT COUNT(*)::integer AS count FROM public.roles',
      );

      if (roleCount[0].count > 0) {
        const expectedRoles = await queryRunner.query(`
          SELECT COUNT(*)::integer AS count
          FROM public.roles
          WHERE id IN (1, 2)
        `);

        if (expectedRoles[0].count !== 2) {
          throw new Error(
            'Existing public.roles data does not contain both role IDs 1 and 2. No role data was changed.',
          );
        }
      }
    }

    if (!rolesExisted) {
      await queryRunner.query(`
        CREATE TABLE public.roles (
          id SERIAL NOT NULL,
          name varchar(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "roles_pkey" PRIMARY KEY (id)
        )
      `);
      await this.setTableMarker(queryRunner, 'roles', {
        created: true,
        seeded: false,
        previousComment: null,
      });
    }

    if (!usersExisted) {
      await queryRunner.query(`
        CREATE TABLE public.users (
          id SERIAL NOT NULL,
          name varchar(255) NOT NULL,
          email varchar(255) NOT NULL,
          password varchar(255) NOT NULL,
          role_id integer,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "users_pkey" PRIMARY KEY (id),
          CONSTRAINT "users_email_key" UNIQUE (email),
          CONSTRAINT "users_role_id_fkey" FOREIGN KEY (role_id)
            REFERENCES public.roles(id)
        )
      `);
      await this.setTableMarker(queryRunner, 'users', {
        created: true,
        seeded: false,
        previousComment: null,
      });
    } else {
      const roleId = await queryRunner.query(`
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'role_id'
      `);

      if (roleId[0]?.is_nullable === 'NO') {
        const previousComment = await this.getColumnComment(
          queryRunner,
          'users',
          'role_id',
        );

        await queryRunner.query(
          'ALTER TABLE public.users ALTER COLUMN role_id DROP NOT NULL',
        );
        await this.setColumnMarker(queryRunner, 'users', 'role_id', {
          wasNotNull: true,
          previousComment,
        });
      } else if (roleId.length === 0) {
        throw new Error(
          'Cannot ensure roles/users schema: public.users.role_id is missing.',
        );
      }
    }

    const roleCount = await queryRunner.query(
      'SELECT COUNT(*)::integer AS count FROM public.roles',
    );

    if (roleCount[0].count === 0) {
      await queryRunner.query(`
        INSERT INTO public.roles (id, name)
        VALUES (1, 'ADMIN'), (2, 'MEMBER')
      `);
      await this.syncRoleSequence(queryRunner);

      if (rolesExisted) {
        const previousComment = await this.getTableComment(
          queryRunner,
          'roles',
        );
        await this.setTableMarker(queryRunner, 'roles', {
          created: false,
          seeded: true,
          previousComment,
        });
      } else {
        await this.setTableMarker(queryRunner, 'roles', {
          created: true,
          seeded: true,
          previousComment: null,
        });
      }
    } else {
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await this.tableExists(queryRunner, 'users')) {
      const userMarker = await this.getTableMarker(queryRunner, 'users');

      if (userMarker?.created) {
        await this.assertNoRows(queryRunner, 'users');
        await this.assertNoForeignKeys(queryRunner, 'users');
        await queryRunner.query('DROP TABLE public.users');
      } else {
        await this.restoreRoleIdNullability(queryRunner);
      }
    }

    if (!(await this.tableExists(queryRunner, 'roles'))) {
      return;
    }

    const roleMarker = await this.getTableMarker(queryRunner, 'roles');
    if (!roleMarker) {
      return;
    }

    if (roleMarker.created) {
      await this.assertNoForeignKeys(queryRunner, 'roles');
      const roles = await queryRunner.query(
        'SELECT id, name FROM public.roles ORDER BY id',
      );

      if (
        roles.length !== 2 ||
        roles[0].id !== 1 ||
        roles[0].name !== 'ADMIN' ||
        roles[1].id !== 2 ||
        roles[1].name !== 'MEMBER'
      ) {
        throw new Error(
          'Refusing to drop public.roles because it contains data beyond the roles created by this migration.',
        );
      }

      await queryRunner.query('DROP TABLE public.roles');
      return;
    }

    if (roleMarker.seeded) {
      await this.assertRoleIdsAreUnused(queryRunner);
      await queryRunner.query(
        'DELETE FROM public.roles WHERE id IN (1, 2) AND name IN ($1, $2)',
        ['ADMIN', 'MEMBER'],
      );
      await this.restoreTableComment(
        queryRunner,
        'roles',
        roleMarker.previousComment,
      );
    }
  }

  private async tableExists(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      'SELECT to_regclass($1) IS NOT NULL AS exists',
      [`public.${tableName}`],
    );

    return result[0].exists;
  }

  private async getTableComment(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<string | null> {
    const result = await queryRunner.query(
      'SELECT obj_description(to_regclass($1), $2) AS comment',
      [`public.${tableName}`, 'pg_class'],
    );

    return result[0].comment;
  }

  private async setTableMarker(
    queryRunner: QueryRunner,
    tableName: string,
    marker: Record<string, unknown>,
  ): Promise<void> {
    const comment = this.markerComment(marker);
    await queryRunner.query(
      `COMMENT ON TABLE public."${tableName}" IS '${comment}'`,
    );
  }

  private async getTableMarker(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<{
    created: boolean;
    seeded: boolean;
    previousComment: string | null;
  } | null> {
    const comment = await this.getTableComment(queryRunner, tableName);

    if (!comment?.startsWith(`${this.marker}:`)) {
      return null;
    }

    return JSON.parse(comment.slice(this.marker.length + 1));
  }

  private async setColumnMarker(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    marker: Record<string, unknown>,
  ): Promise<void> {
    const comment = this.markerComment(marker);
    await queryRunner.query(
      `COMMENT ON COLUMN public."${tableName}"."${columnName}" IS '${comment}'`,
    );
  }

  private async getColumnComment(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<string | null> {
    const result = await queryRunner.query(
      `
        SELECT col_description(
          to_regclass($1),
          (
            SELECT attnum
            FROM pg_attribute
            WHERE attrelid = to_regclass($1)
              AND attname = $2
              AND NOT attisdropped
          )
        ) AS comment
      `,
      [`public.${tableName}`, columnName],
    );

    return result[0].comment;
  }

  private async restoreRoleIdNullability(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const marker = await this.getColumnComment(queryRunner, 'users', 'role_id');

    if (!marker?.startsWith(`${this.marker}:`)) {
      return;
    }

    const previousState = JSON.parse(marker.slice(this.marker.length + 1)) as {
      wasNotNull: boolean;
      previousComment: string | null;
    };

    if (previousState.wasNotNull) {
      const nullValues = await queryRunner.query(
        'SELECT EXISTS (SELECT 1 FROM public.users WHERE role_id IS NULL) AS exists',
      );

      if (nullValues[0].exists) {
        throw new Error(
          'Refusing to restore NOT NULL on users.role_id while NULL values exist.',
        );
      }

      await queryRunner.query(
        'ALTER TABLE public.users ALTER COLUMN role_id SET NOT NULL',
      );
    }

    await queryRunner.query(
      `COMMENT ON COLUMN public.users.role_id IS ${
        previousState.previousComment === null
          ? 'NULL'
          : `'${this.escapeLiteral(previousState.previousComment)}'`
      }`,
    );
  }

  private async restoreTableComment(
    queryRunner: QueryRunner,
    tableName: string,
    comment: string | null,
  ): Promise<void> {
    await queryRunner.query(
      `COMMENT ON TABLE public."${tableName}" IS ${
        comment === null ? 'NULL' : `'${this.escapeLiteral(comment)}'`
      }`,
    );
  }

  private markerComment(marker: Record<string, unknown>): string {
    return this.escapeLiteral(`${this.marker}:${JSON.stringify(marker)}`);
  }

  private escapeLiteral(value: string): string {
    return value.replace(/'/g, String.fromCharCode(39).repeat(2));
  }

  private async syncRoleSequence(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        sequence_name text;
        sequence_value bigint;
        maximum_role_id bigint;
      BEGIN
        sequence_name := pg_get_serial_sequence('public.roles', 'id');
        IF sequence_name IS NOT NULL THEN
          EXECUTE format('SELECT last_value FROM %s', sequence_name::regclass)
            INTO sequence_value;
          SELECT MAX(id) INTO maximum_role_id FROM public.roles;
          PERFORM setval(
            sequence_name::regclass,
            GREATEST(COALESCE(sequence_value, 1), maximum_role_id),
            true
          );
        END IF;
      END;
      $$
    `);
  }

  private async assertNoRows(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    const result = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM public."${tableName}") AS exists`,
    );

    if (result[0].exists) {
      throw new Error(
        `Refusing to drop public.${tableName} because it contains data.`,
      );
    }
  }

  private async assertNoForeignKeys(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    const result = await queryRunner.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE contype = 'f'
            AND confrelid = to_regclass($1)
        ) AS exists
      `,
      [`public.${tableName}`],
    );

    if (result[0].exists) {
      throw new Error(
        `Refusing to drop public.${tableName} because other tables reference it.`,
      );
    }
  }

  private async assertRoleIdsAreUnused(
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (!(await this.tableExists(queryRunner, 'users'))) {
      return;
    }

    const result = await queryRunner.query(
      'SELECT EXISTS (SELECT 1 FROM public.users WHERE role_id IN (1, 2)) AS exists',
    );

    if (result[0].exists) {
      throw new Error(
        'Refusing to remove seeded roles while users reference them.',
      );
    }
  }
}
