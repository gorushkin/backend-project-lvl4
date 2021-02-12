module.exports = {
  translation: {
    appName: 'Менеджер задач',
    flash: {
      session: {
        create: {
          success: 'Вы залогинены',
          error: 'Неправильный емейл или пароль',
        },
        delete: {
          success: 'Вы разлогинены',
        },
      },
      users: {
        create: {
          error: 'Не удалось зарегистрировать',
          success: 'Пользователь успешно зарегистрирован',
        },
        edit: {
          error: 'Не удалось изменить пользователя',
          success: 'Данные пользователя были изменены',
        },
        delete: {
          error: 'Не удалось удалить пользователя',
          success: 'Пользователь успешно удалён',
        },
        authError: 'Вы не можете редактировать или удалять другого пользователя',
      },
      statuses: {
        create: {
          error: 'Не удалось создать статус',
          success: 'Статус успешно создан',
        },
        edit: {
          error: 'Не удалось изменить статус',
          success: 'Статус успешно создан изменен',
        },
        delete: {
          error: 'Не удалось удалить статус',
          success: 'Статус успешно удалён',
        },
        authError: 'Вы не можете редактировать или удалять другого пользователя',
      },
      tasks: {
        create: {
          error: 'Не удалось создать задачу',
          success: 'Задача успешно создана',
        },
        edit: {
          error: 'Не удалось изменить задачу',
          success: 'Задача успешно создан изменена',
        },
        delete: {
          error: 'Не удалось удалить задачу',
          success: 'Задача успешно удалёна',
        },
        authError: 'Вы не можете редактировать или удалять другого пользователя',
        detailsError: 'Нет задачи с такими параметрами',
      },
      authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
    },
    layouts: {
      application: {
        users: 'Пользователи',
        statuses: 'Статусы',
        tasks: 'Задачи',
        signIn: 'Вход',
        signUp: 'Регистрация',
        signOut: 'Выход',
      },
    },
    views: {
      session: {
        new: {
          signIn: 'Вход',
          submit: 'Войти',
        },
      },
      users: {
        id: 'ID',
        firstname: 'Имя',
        lastname: 'Фамилия',
        email: 'Email',
        createdAt: 'Дата создания',
        actions: 'Действия',
        edit: 'Изменить',
        new: {
          submit: 'Сохранить',
          signUp: 'Регистрация',
        },
        editTitle: 'Изменение пользователя',
      },
      statuses: {
        id: 'ID',
        name: 'Наименование',
        createdAt: 'Дата создания',
        actions: '',
        edit: 'Изменить',
        new: {
          submit: 'Создать',
          signUp: 'Регистрация',
        },
        createTitle: 'Создание статуса',
        editTitle: 'Изменение статуса',
      },
      tasks: {
        id: 'ID',
        name: 'Наименование',
        status: 'Статус',
        edit: 'Изменить',
        creator: 'Автор',
        executor: 'Исполнитель',
        createdAt: '	Дата создания	',
        new: {
          submit: 'Создать',
          signUp: 'Регистрация',
        },
        createTitle: 'Создание задачи',
        editTitle: 'Изменение задачи',
        actions: '',
        editTitle: 'Изменить задачу',
      },

      welcome: {
        index: {
          hello: 'Привет от Хекслета!',
          description: 'Практические курсы по программированию',
          more: 'Узнать Больше',
        },
      },
    },
  },
};
