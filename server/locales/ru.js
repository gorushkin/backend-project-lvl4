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
          success: 'Пользователь успешно изменён',
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
          success: 'Статус успешно изменён',
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
          success: 'Задача успешно изменена',
        },
        delete: {
          error: 'Не удалось удалить задачу',
          success: 'Задача успешно удалена',
        },
        authError: 'Задачу может удалить только ее автор',
        showError: 'Нет задачи с такими параметрами',
      },
      labels: {
        create: {
          error: 'Не удалось создать метку',
          success: 'Метка успешно создана',
        },
        edit: {
          error: 'Не удалось изменить метку',
          success: 'Метка успешно изменена',
        },
        delete: {
          error: 'Не удалось удалить метку',
          success: 'Метка успешно удалена',
        },
        authError: 'Задачу может удалить только ее автор',
        showError: 'Нет метки с такими параметрами',
      },
      authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
    },
    layouts: {
      application: {
        users: 'Пользователи',
        statuses: 'Статусы',
        tasks: 'Задачи',
        labels: 'Метки',
        signIn: 'Вход',
        signUp: 'Регистрация',
        signOut: 'Выход',
      },
    },
    form: {
      name: 'Наименование',
      email: 'Email',
      description: 'Описание',
      firstName: 'Имя',
      lastName: 'Фамилия',
      password: 'Пароль',
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
        firstName: 'Имя',
        lastName: 'Фамилия22',
        fullName: 'Полное имя',
        email: 'Email',
        createdAt: 'Дата создания',
        actions: 'Действия',
        edit: 'Изменить',
        new: {
          submit: 'Сохранить',
          signUp: 'Регистрация',
        },
        delete: 'Удалить',
        editTitle: 'Изменение пользователя',
      },
      statuses: {
        id: 'ID',
        name: 'Наименование',
        createdAt: 'Дата создания',
        actions: '',
        edit: 'Изменить',
        createBtn: 'Создать',
        new: {
          submit: 'Создать',
          signUp: 'Регистрация',
        },
        create: ' Создать статус',
        delete: 'Удалить',
        createTitle: 'Создание статуса',
        editTitle: 'Изменение статуса',
      },
      tasks: {
        id: 'ID',
        creator: 'Автор',
        executorId: 'Исполнитель',
        name: 'Наименование',
        statusId: 'Статус',
        edit: 'Изменить',
        createdAt: 'Дата создания',
        labels: 'Метки:',
        new: {
          submit: 'Создать',
          signUp: 'Регистрация',
        },
        delete: 'Удалить',
        create: 'Создать задачу',
        createTitle: 'Создание задачи',
        editTitle: 'Изменение задачи',
        actions: '',
        status: 'Статус',
        executor: 'Исполнитель',
        filter: 'Показать',
        isCreatorUser: 'Только мои задачи',
        label: 'Метка',
        filters: {
          status: 'Статус',
          executor: 'Исполнитель',
          label: 'Метка',
          isCreatorUser: 'Только мои задачи',
        },
      },
      labels: {
        id: 'ID',
        name: 'Наименование',
        edit: 'Изменить',
        createdAt: 'Дата создания',
        new: {
          submit: 'Создать',
        },
        delete: 'Удалить',
        createTitle: 'Создание метки',
        editTitle: 'Изменение метки',
        actions: '',
        create: 'Создать метку',
      },
      welcome: {
        index: {
          hello: 'Привет от Хекслета!',
          description: 'Практические курсы по программированию',
          more: 'Узнать Больше',
        },
      },
      task: {
        filters: {
          status: 'Статус',
          executor: 'Исполнитель',
          label: 'Метка',
          isCreatorUser: 'Только мои задачи',
        },
      },
    },
  },
};
