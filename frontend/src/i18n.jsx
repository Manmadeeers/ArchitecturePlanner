import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "architecture-planner-language";
const DEFAULT_LANGUAGE = "ru";

export const LANGUAGE_OPTIONS = [
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
  { code: "be", label: "Беларуская" },
];

const LOCALE_BY_LANGUAGE = {
  ru: "ru-RU",
  en: "en-US",
  be: "be-BY",
};

const messages = {
  ru: {
    views: {
      planner: "Планировщик",
      profile: "Профиль",
      projects: "Библиотека проектов",
      admin: "Админ",
    },
    common: {
      theme: "Тема",
      light: "Светлая",
      dark: "Тёмная",
      language: "Язык",
      signedIn: "Выполнен вход",
      workspace: "Рабочая область",
      authentication: "Аутентификация",
      system: "Система",
      notEnoughData: "Пока недостаточно данных.",
      notProvided: "Не указано",
      delete: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c",
      save: "Сохранить",
      cancel: "Отмена",
    },
    hero: {
      eyebrow: "Профессиональная среда для проектирования архитектуры",
      copy:
        "Детерминированное планирование архитектуры для стартапов и небольших компаний. Собирайте проектные ограничения, анализируйте инфраструктурные рекомендации и храните историю проектов для каждого авторизованного пользователя.",
      profileSubtitle: "Открыть профиль и сохранённые проекты",
      openProfileAria: "Открыть профиль пользователя {name}",
      openMenuAria: "Открыть меню рабочей области",
      openAdminPanel: "Открыть админ-панель",
      backToPlanner: "Вернуться к планировщику",
      logout: "Выйти",
      signUp: "Регистрация",
      logIn: "Войти",
      checkingSession: "Проверка сессии...",
      authSetupRequired: "Настройка Auth0 обязательна перед использованием защищённых действий.",
      authNotConfiguredTitle: "Аутентификация ещё не настроена.",
      authNotConfiguredBody:
        "Добавьте переменные окружения Auth0 из frontend/.env.example и backend/.env.example, чтобы включить регистрацию, вход и защищённые API-запросы.",
      signInRequiredTitle: "Чтобы генерировать и сохранять планы, нужно войти.",
      signInRequiredBody: "Войдите или зарегистрируйтесь через Auth0, чтобы продолжить работу с приложением.",
    },
    questionnaire: {
      title: "Анкета проекта",
      description: "Эти ответы напрямую влияют на rule engine. В логике рекомендаций ИИ не используется.",
      submit: "Сгенерировать архитектурный план",
      submitting: "Генерация архитектуры...",
      stepProgress: "\u0428\u0430\u0433 {current}/{total}",
      back: "\u041d\u0430\u0437\u0430\u0434",
      continue: "\u0414\u0430\u043b\u0435\u0435",
      signInHint:
        "\u0412\u043e\u0439\u0434\u0438\u0442\u0435, \u0447\u0442\u043e\u0431\u044b \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0438 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u043f\u043b\u0430\u043d.",
      steps: {
        scope: {
          title: "\u041a\u043e\u043d\u0442\u0435\u043a\u0441\u0442 \u043f\u0440\u043e\u0435\u043a\u0442\u0430",
          description:
            "\u041e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u0435 \u0442\u0438\u043f \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u0430 \u0438 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u044f \u0437\u0430\u043f\u0443\u0441\u043a\u0430.",
        },
        scale: {
          title: "\u041c\u0430\u0441\u0448\u0442\u0430\u0431 \u0438 \u0431\u044e\u0434\u0436\u0435\u0442",
          description:
            "\u0417\u0430\u0434\u0430\u0439\u0442\u0435 \u0442\u0440\u0430\u0444\u0438\u043a, \u0431\u044e\u0434\u0436\u0435\u0442 \u0438 \u043e\u0436\u0438\u0434\u0430\u0435\u043c\u044b\u0439 \u0440\u043e\u0441\u0442.",
        },
        product: {
          title: "\u0424\u0443\u043d\u043a\u0446\u0438\u0438",
          description:
            "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043a\u043b\u044e\u0447\u0435\u0432\u044b\u0435 \u0444\u0443\u043d\u043a\u0446\u0438\u0438 \u0438 \u043f\u043e\u0442\u0440\u0435\u0431\u043d\u043e\u0441\u0442\u044c \u0432 realtime.",
        },
        operations: {
          title: "\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u043f\u0440\u043e\u0444\u0438\u043b\u044c",
          description:
            "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u0442\u0435 \u043d\u0430\u0434\u0435\u0436\u043d\u043e\u0441\u0442\u044c, \u0447\u0443\u0432\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0445 \u0438 \u0443\u0440\u043e\u0432\u0435\u043d\u044c \u043a\u043e\u043c\u0430\u043d\u0434\u044b.",
        },
      },
    },
    result: {
      title: "Сгенерированный результат",
      description: "Результат включает краткое резюме, оценку стоимости, дорожную карту и экспортируемые файлы диаграмм.",
      empty: "Ваш сгенерированный архитектурный план появится здесь после отправки анкеты.",
    },    workspace: {
      tabsAria: "\u0420\u0430\u0431\u043e\u0447\u0430\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c \u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0449\u0438\u043a\u0430",
      resultReady: "\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u0433\u043e\u0442\u043e\u0432.",
      openResult: "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442",
    },

    profile: {
      title: "Ваш профиль",
      description: "Просмотрите пользовательскую запись, связанную с backend, и откройте полную библиотеку проектов для этой учётной записи.",
      identity: "Идентификация",
      displayName: "Отображаемое имя",
      email: "Email",
      role: "Роль",
      linkedAccounts: "Связанные учётные записи",
      localUserId: "Локальный id пользователя",
      auth0Subject: "Auth0 subject",
      savedProjectsLoaded: "Загружено сохранённых проектов",
      notSyncedYet: "Ещё не синхронизировано",
      notAvailable: "Недоступно",
      projectLibraryTitle: "Библиотека проектов",
      projectLibraryBody: "Откройте все проекты этого пользователя и изучите любой из них в полном виде.",
      viewAllProjects: "Показать все проекты",
      loadingProjects: "Загрузка проектов...",
    },
    projects: {
      title: "Ваши проекты",
      description: "Выберите сохранённый архитектурный план, чтобы загрузить полный результат, экспорты и региональные рекомендации.",
      loadingProjects: "Загрузка сохранённых проектов...",
      empty: "Пока нет сохранённых проектов. Сгенерируйте первый архитектурный план, чтобы заполнить библиотеку.",
      detailTitle: "Детали проекта",
      detailDescription: "Детали сохранённого плана используют тот же рендеринг, что и живая выдача, включая экспорты.",
      loadingDetail: "Загрузка деталей проекта...",
      selectProject: "Выберите любую карточку проекта, чтобы загрузить полную сохранённую архитектурную рекомендацию.",
      architectureTbd: "Архитектура ещё не определена",
      noCostSaved: "Стоимость не сохранена",
      delete: "Удалить проект",
      deleting: "Удаление...",
      deleteConfirm: "Удалить проект {name}?",
      cardSummaryFull: "{architectureStyle}, {deploymentModel}, регион {region}.",
      cardSummaryShort: "{architectureStyle}, {deploymentModel}.",
    },
    plan: {
      architecture: "Архитектура",
      deployment: "Развёртывание",
      monthlyCost: "Ежемесячная стоимость",
      region: "Регион",
      recommendationSummary: "Краткое резюме рекомендации",
      summaryTemplate:
        "Для проекта {projectName} лучше всего подходит архитектура {architectureStyle}. Для региона {region} рекомендуется вариант развёртывания {deploymentModel}. Выбранный набор компонентов учитывает технический уровень команды {teamTechnicalLevel} и бюджетный профиль {costProfile}.",
      architectureComponents: "Компоненты архитектуры",
      costEstimate: "Оценка стоимости",
      monthlyCostSentence: "Оценочная ежемесячная стоимость инфраструктуры: {value}",
      developmentRoadmap: "Дорожная карта развития",
      developmentPlan: "Оценочный план разработки",
      regionNotes: "Региональные заметки",
      risks: "Риски",
      downloadDrawio: "Скачать .drawio",
      downloadSvg: "Скачать .svg",
      diagramTitleFallback: "Архитектурный план",
    },
    admin: {
      title: "Админ-панель",
      description: "Управляйте доступом, настраивайте безопасные параметры детерминированного движка и просматривайте системную активность.",
      loading: "Загрузка административной области...",
      totalUsers: "Всего пользователей",
      adminUsers: "Администраторы",
      generatedPlans: "Сгенерированные планы",
      averageMonthlyEstimate: "Средняя месячная оценка",
      popularArchitectures: "Популярные архитектуры",
      popularDeploymentModels: "Популярные модели развёртывания",
      commonTechnologyComponents: "Частые технологические компоненты",
      activeRegions: "Самые активные регионы",
      businessTypes: "Типы бизнеса",
      stackPatterns: "Паттерны стеков",
      recentPlanVolume: "Недавний объём планов",
      noPlansYet: "Планы ещё не генерировались.",
      recentAdminActivity: "Недавняя активность администраторов",
      noAdminActivity: "Действия администраторов пока не зафиксированы.",
      userManagement: "Управление пользователями",
      userManagementDescription: "Повышайте и понижайте роли, а также отслеживайте активность пользователей.",
      searchUsers: "Поиск пользователей",
      searchUsersPlaceholder: "Фильтр по имени, email или Auth0 subject",
      noUsersMatch: "По текущему фильтру пользователи не найдены.",
      unnamedUser: "Пользователь без имени",
      noEmail: "Email не указан",
      projectsCount: "Проекты: {count}",
      joined: "Дата регистрации: {date}",
      currentAdmin: "Текущий авторизованный администратор",
      editDetails: "Редактировать данные",
      deleteUser: "Удалить пользователя",
      deletingUser: "Удаление...",
      deleteConfirm: "Удалить пользователя {name}? Вместе с ним будут удалены и все сохранённые проекты.",
      deleteTechnology: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u044e",
      deleteTechnologyConfirm: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u044e \"{name}\"?",
      saveChanges: "Сохранить изменения",
      savingChanges: "Сохранение...",
      setAsUser: "Сделать пользователем",
      makeAdmin: "Сделать админом",
      updating: "Обновление...",
      engineSettings: "Настройки движка",
      engineSettingsDescription: "Настраивайте безопасные детерминированные параметры, такие как веса стоимости, региональные коэффициенты и правила дорожной карты.",
      lastUpdatedOn: "Последнее обновление: {value}",
      updatedByUser: "пользователь #{userId}",
      usingDefaultSettings: "Используются настройки движка по умолчанию до первого сохранения администратором.",
      regionCostMultipliers: "Региональные коэффициенты стоимости",
      baseArchitectureCosts: "Базовые стоимости архитектур",
      costModelControls: "Параметры модели стоимости",
      featureComponentWeight: "Вес функционального компонента",
      monthlyUsersDivider: "Делитель месячной аудитории",
      fastDeliverySurcharge: "Надбавка за быструю поставку",
      roadmapToggles: "Переключатели дорожной карты",
      roadmapToggleDescription: "Включайте или отключайте этот детерминированный шаг дорожной карты для будущих сгенерированных планов.",
      saveEngineSettings: "Сохранить настройки движка",
      savingEngineSettings: "Сохранение настроек...",
      waitingEngineSettings: "Настройки движка появятся здесь после завершения загрузки административной области.",
    },
    errors: {
      loadQuestionnaire: "Не удалось загрузить анкету из API.",
      protectedData: "Войдите в систему, прежде чем обращаться к защищённым данным.",
      openProjects: "Войдите в систему, прежде чем открывать сохранённые проекты.",
      adminAccess: "Для открытия админ-панели требуются права администратора.",
      generatePlan: "Войдите в систему, прежде чем генерировать архитектурный план.",
      auth0Missing: "Auth0 ещё не настроен. Сначала добавьте переменные окружения Auth0 для frontend и backend.",
    },
  },
  en: {
    views: {
      planner: "Planner",
      profile: "Profile",
      projects: "Project Library",
      admin: "Admin",
    },
    common: {
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      language: "Language",
      signedIn: "Signed in",
      workspace: "Workspace",
      authentication: "Authentication",
      system: "System",
      notEnoughData: "Not enough data yet.",
      notProvided: "Not provided",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
    },
    hero: {
      eyebrow: "Professional architecture planning workspace",
      copy:
        "Deterministic architecture planning for startups and small companies. Capture project constraints, review infrastructure recommendations, and keep a clean project history under each authenticated account.",
      profileSubtitle: "Open profile and saved projects",
      openProfileAria: "Open profile for {name}",
      openMenuAria: "Open workspace menu",
      openAdminPanel: "Open admin panel",
      backToPlanner: "Back to planner",
      logout: "Log out",
      signUp: "Sign up",
      logIn: "Log in",
      checkingSession: "Checking session...",
      authSetupRequired: "Auth0 setup is required before protected actions can be used.",
      authNotConfiguredTitle: "Authentication is not configured yet.",
      authNotConfiguredBody:
        "Add the Auth0 environment variables from frontend/.env.example and backend/.env.example to enable registration, login, and protected API calls.",
      signInRequiredTitle: "Sign in is required to generate and save plans.",
      signInRequiredBody: "Log in or sign up with Auth0 to continue using the application.",
    },
    questionnaire: {
      title: "Project Questionnaire",
      description: "These answers drive the rule engine directly. No AI is involved in the recommendation logic.",
      submit: "Generate architecture plan",
      submitting: "Generating architecture...",
      stepProgress: "Step {current}/{total}",
      back: "Back",
      continue: "Continue",
      signInHint: "Sign in to generate and save your plan.",
      steps: {
        scope: {
          title: "Project context",
          description: "Define product type and launch constraints.",
        },
        scale: {
          title: "Scale and budget",
          description: "Set traffic, budget, and expected growth.",
        },
        product: {
          title: "Capabilities",
          description: "Choose key features and whether realtime is needed.",
        },
        operations: {
          title: "Operational profile",
          description: "Set reliability, data sensitivity, and team readiness.",
        },
      },
    },
    result: {
      title: "Generated Result",
      description: "The result includes summary, cost estimate, roadmap, and exportable diagram files.",
      empty: "Your generated architecture plan will appear here after submission.",
    },    workspace: {
      tabsAria: "Planner workspace",
      resultReady: "Result is ready.",
      openResult: "Open result",
    },

    profile: {
      title: "Your Profile",
      description: "Review the backend-linked user record and open the full project library for this account.",
      identity: "Identity",
      displayName: "Display name",
      email: "Email",
      role: "Role",
      linkedAccounts: "Linked accounts",
      localUserId: "Local user id",
      auth0Subject: "Auth0 subject",
      savedProjectsLoaded: "Saved projects loaded",
      notSyncedYet: "Not synced yet",
      notAvailable: "Not available",
      projectLibraryTitle: "Project library",
      projectLibraryBody: "Open every project saved for this authenticated user and inspect any project in full detail.",
      viewAllProjects: "View all projects",
      loadingProjects: "Loading projects...",
    },
    projects: {
      title: "Your Projects",
      description: "Choose a saved architecture plan to load the full result, exports, and regional guidance.",
      loadingProjects: "Loading your saved projects...",
      empty: "No saved projects yet. Generate your first architecture plan to populate this library.",
      detailTitle: "Project Detail",
      detailDescription: "Saved plan detail uses the same rendering as the live result view, including exports.",
      loadingDetail: "Loading project detail...",
      selectProject: "Select any project card to load the full saved architecture recommendation.",
      architectureTbd: "Architecture TBD",
      noCostSaved: "No cost saved",
      delete: "Delete project",
      deleting: "Deleting...",
      deleteConfirm: "Delete project {name}?",
      cardSummaryFull: "{architectureStyle}, {deploymentModel}, region {region}.",
      cardSummaryShort: "{architectureStyle}, {deploymentModel}.",
    },
    plan: {
      architecture: "Architecture",
      deployment: "Deployment",
      monthlyCost: "Monthly Cost",
      region: "Region",
      recommendationSummary: "Recommendation summary",
      summaryTemplate:
        "{projectName} is best served by a {architectureStyle} architecture. The recommended deployment model for {region} is {deploymentModel}. The chosen component set fits a {teamTechnicalLevel} technical team and a {costProfile} budget profile.",
      architectureComponents: "Architecture components",
      costEstimate: "Cost estimate",
      monthlyCostSentence: "Estimated monthly infrastructure cost: {value}",
      developmentRoadmap: "Development roadmap",
      developmentPlan: "Estimated development plan",
      regionNotes: "Region notes",
      risks: "Risks",
      downloadDrawio: "Download .drawio",
      downloadSvg: "Download .svg",
      diagramTitleFallback: "Architecture Plan",
    },
    admin: {
      title: "Admin Dashboard",
      description: "Manage access, tune deterministic engine settings, and review system-wide architecture activity.",
      loading: "Loading admin workspace...",
      totalUsers: "Total users",
      adminUsers: "Admin users",
      generatedPlans: "Generated plans",
      averageMonthlyEstimate: "Average monthly estimate",
      popularArchitectures: "Popular architectures",
      popularDeploymentModels: "Popular deployment models",
      commonTechnologyComponents: "Common technology components",
      activeRegions: "Most active regions",
      businessTypes: "Business types",
      stackPatterns: "Stack patterns",
      recentPlanVolume: "Recent plan volume",
      noPlansYet: "No plans have been generated yet.",
      recentAdminActivity: "Recent admin activity",
      noAdminActivity: "No admin actions have been recorded yet.",
      userManagement: "User Management",
      userManagementDescription: "Promote or demote users and keep track of who is actively generating projects.",
      searchUsers: "Search users",
      searchUsersPlaceholder: "Filter by name, email, or Auth0 subject",
      noUsersMatch: "No users match your current search.",
      unnamedUser: "Unnamed user",
      noEmail: "No email provided",
      projectsCount: "Projects: {count}",
      joined: "Joined {date}",
      currentAdmin: "Current signed-in admin",
      editDetails: "Edit details",
      deleteUser: "Delete user",
      deletingUser: "Deleting...",
      deleteConfirm: "Delete {name}? Their saved projects will be removed as well.",
      deleteTechnology: "Delete technology",
      deleteTechnologyConfirm: "Delete technology \"{name}\"?",
      saveChanges: "Save changes",
      savingChanges: "Saving...",
      setAsUser: "Set as user",
      makeAdmin: "Make admin",
      updating: "Updating...",
      engineSettings: "Engine Settings",
      engineSettingsDescription: "Adjust safe deterministic inputs like cost weights, regional multipliers, and roadmap toggles.",
      lastUpdatedOn: "Last updated on {value}",
      updatedByUser: "by user #{userId}",
      usingDefaultSettings: "Using default engine settings until the first admin save.",
      regionCostMultipliers: "Region cost multipliers",
      baseArchitectureCosts: "Base architecture costs",
      costModelControls: "Cost model controls",
      featureComponentWeight: "Feature component weight",
      monthlyUsersDivider: "Monthly users divider",
      fastDeliverySurcharge: "Fast delivery surcharge",
      roadmapToggles: "Roadmap toggles",
      roadmapToggleDescription: "Enable or disable this deterministic roadmap step in future generated plans.",
      saveEngineSettings: "Save engine settings",
      savingEngineSettings: "Saving settings...",
      waitingEngineSettings: "Engine settings will appear here once the admin workspace finishes loading.",
    },
    errors: {
      loadQuestionnaire: "Could not load questionnaire definition from the API.",
      protectedData: "Sign in before accessing protected project data.",
      openProjects: "Sign in before opening your saved projects.",
      adminAccess: "Admin access is required before opening the admin dashboard.",
      generatePlan: "Sign in before generating an architecture plan.",
      auth0Missing: "Auth0 is not configured yet. Add the frontend and backend Auth0 environment variables first.",
    },
  },
  be: {
    views: {
      planner: "Планіроўшчык",
      profile: "Профіль",
      projects: "Бібліятэка праектаў",
      admin: "Адмін",
    },
    common: {
      theme: "Тэма",
      light: "Светлая",
      dark: "Цёмная",
      language: "Мова",
      signedIn: "Уваход выкананы",
      workspace: "Працоўная вобласць",
      authentication: "Аўтэнтыфікацыя",
      system: "Сістэма",
      notEnoughData: "Пакуль недастаткова даных.",
      notProvided: "Не пазначана",
      delete: "\u0412\u044b\u0434\u0430\u043b\u0456\u0446\u044c",
      save: "Захаваць",
      cancel: "Скасаваць",
    },
    hero: {
      eyebrow: "Прафесійная прастора для планавання архітэктуры",
      copy:
        "Дэтэрмінаванае планаванне архітэктуры для стартапаў і невялікіх кампаній. Фіксуйце абмежаванні праекта, аналізуйце інфраструктурныя рэкамендацыі і захоўвайце гісторыю праектаў для кожнага аўтарызаванага карыстальніка.",
      profileSubtitle: "Адкрыць профіль і захаваныя праекты",
      openProfileAria: "Адкрыць профіль карыстальніка {name}",
      openMenuAria: "Адкрыць меню працоўнай вобласці",
      openAdminPanel: "Адкрыць адмін-панэль",
      backToPlanner: "Вярнуцца да планіроўшчыка",
      logout: "Выйсці",
      signUp: "Рэгістрацыя",
      logIn: "Увайсці",
      checkingSession: "Праверка сесіі...",
      authSetupRequired: "Патрэбна наладзіць Auth0 перад выкарыстаннем абароненых дзеянняў.",
      authNotConfiguredTitle: "Аўтэнтыфікацыя яшчэ не наладжана.",
      authNotConfiguredBody:
        "Дадайце пераменныя асяроддзя Auth0 з frontend/.env.example і backend/.env.example, каб уключыць рэгістрацыю, уваход і абароненыя API-запыты.",
      signInRequiredTitle: "Каб генераваць і захоўваць планы, трэба ўвайсці.",
      signInRequiredBody: "Увайдзіце або зарэгіструйцеся праз Auth0, каб працягнуць працу з праграмай.",
    },
    questionnaire: {
      title: "Анкета праекта",
      description: "Гэтыя адказы непасрэдна ўплываюць на rule engine. ШІ ў логіцы рэкамендацый не выкарыстоўваецца.",
      submit: "Згенераваць архітэктурны план",
      submitting: "Генерацыя архітэктуры...",
      stepProgress: "\u041a\u0440\u043e\u043a {current}/{total}",
      back: "\u041d\u0430\u0437\u0430\u0434",
      continue: "\u0414\u0430\u043b\u0435\u0439",
      signInHint:
        "\u0423\u0432\u0430\u0439\u0434\u0437\u0456\u0446\u0435, \u043a\u0430\u0431 \u0437\u0433\u0435\u043d\u0435\u0440\u0430\u0432\u0430\u0446\u044c \u0456 \u0437\u0430\u0445\u0430\u0432\u0430\u0446\u044c \u043f\u043b\u0430\u043d.",
      steps: {
        scope: {
          title: "\u041a\u0430\u043d\u0442\u044d\u043a\u0441\u0442 \u043f\u0440\u0430\u0435\u043a\u0442\u0430",
          description:
            "\u0412\u044b\u0437\u043d\u0430\u0447\u0446\u0435 \u0442\u044b\u043f \u043f\u0440\u0430\u0434\u0443\u043a\u0442\u0430 \u0456 \u0430\u0431\u043c\u0435\u0436\u0430\u0432\u0430\u043d\u043d\u0456 \u0437\u0430\u043f\u0443\u0441\u043a\u0443.",
        },
        scale: {
          title: "\u041c\u0430\u0441\u0448\u0442\u0430\u0431 \u0456 \u0431\u044e\u0434\u0436\u044d\u0442",
          description:
            "\u0417\u0430\u0434\u0430\u0439\u0446\u0435 \u0442\u0440\u0430\u0444\u0456\u043a, \u0431\u044e\u0434\u0436\u044d\u0442 \u0456 \u0447\u0430\u043a\u0430\u043d\u044b \u0440\u043e\u0441\u0442.",
        },
        product: {
          title: "\u0424\u0443\u043d\u043a\u0446\u044b\u0456",
          description:
            "\u0410\u0431\u044f\u0440\u044b\u0446\u0435 \u043a\u043b\u044e\u0447\u0430\u0432\u044b\u044f \u0444\u0443\u043d\u043a\u0446\u044b\u0456 \u0456 \u043f\u0430\u0442\u0440\u044d\u0431\u0443 \u045e realtime.",
        },
        operations: {
          title: "\u0410\u043f\u0435\u0440\u0430\u0446\u044b\u0439\u043d\u044b \u043f\u0440\u043e\u0444\u0456\u043b\u044c",
          description:
            "\u041d\u0430\u043b\u0430\u0434\u0437\u044c\u0446\u0435 \u043d\u0430\u0434\u0437\u0435\u0439\u043d\u0430\u0441\u0446\u044c, \u0447\u0443\u0432\u0430\u043b\u0456\u0432\u0430\u0441\u0446\u044c \u0434\u0430\u043d\u044b\u0445 \u0456 \u0443\u0437\u0440\u043e\u0432\u0435\u043d\u044c \u043a\u0430\u043c\u0430\u043d\u0434\u044b.",
        },
      },
    },
    result: {
      title: "Згенераваны вынік",
      description: "Вынік уключае кароткае рэзюмэ, ацэнку кошту, дарожную карту і файлы дыяграм для экспарту.",
      empty: "Ваш згенераваны архітэктурны план з'явіцца тут пасля адпраўкі анкеты.",
    },    workspace: {
      tabsAria: "\u041f\u0440\u0430\u0446\u043e\u045e\u043d\u0430\u044f \u0432\u043e\u0431\u043b\u0430\u0441\u0446\u044c \u043f\u043b\u0430\u043d\u0456\u0440\u043e\u045e\u0448\u0447\u044b\u043a\u0430",
      resultReady: "\u0412\u044b\u043d\u0456\u043a \u0433\u0430\u0442\u043e\u0432\u044b.",
      openResult: "\u0410\u0434\u043a\u0440\u044b\u0446\u044c \u0432\u044b\u043d\u0456\u043a",
    },

    profile: {
      title: "Ваш профіль",
      description: "Праглядзіце запіс карыстальніка, звязаны з backend, і адкрыйце поўную бібліятэку праектаў для гэтага акаўнта.",
      identity: "Ідэнтыфікацыя",
      displayName: "Імя для адлюстравання",
      email: "Email",
      role: "Роля",
      linkedAccounts: "Звязаныя акаўнты",
      localUserId: "Лакальны id карыстальніка",
      auth0Subject: "Auth0 subject",
      savedProjectsLoaded: "Загружана захаваных праектаў",
      notSyncedYet: "Яшчэ не сінхранізавана",
      notAvailable: "Недаступна",
      projectLibraryTitle: "Бібліятэка праектаў",
      projectLibraryBody: "Адкрыйце ўсе праекты гэтага карыстальніка і вывучыце любы з іх у поўным выглядзе.",
      viewAllProjects: "Паказаць усе праекты",
      loadingProjects: "Загрузка праектаў...",
    },
    projects: {
      title: "Вашы праекты",
      description: "Выберыце захаваны архітэктурны план, каб загрузіць поўны вынік, экспарты і рэгіянальныя рэкамендацыі.",
      loadingProjects: "Загрузка захаваных праектаў...",
      empty: "Пакуль няма захаваных праектаў. Згенеруйце першы архітэктурны план, каб запоўніць бібліятэку.",
      detailTitle: "Дэталі праекта",
      detailDescription: "Дэталі захаванага плана выкарыстоўваюць той жа рэндэрынг, што і жывы вынік, уключаючы экспарты.",
      loadingDetail: "Загрузка дэталяў праекта...",
      selectProject: "Выберыце любую картку праекта, каб загрузіць поўную захаваную архітэктурную рэкамендацыю.",
      architectureTbd: "Архітэктура яшчэ не вызначана",
      noCostSaved: "Кошт не захаваны",
      delete: "Выдаліць праект",
      deleting: "Выдаленне...",
      deleteConfirm: "Выдаліць праект {name}?",
      cardSummaryFull: "{architectureStyle}, {deploymentModel}, рэгіён {region}.",
      cardSummaryShort: "{architectureStyle}, {deploymentModel}.",
    },
    plan: {
      architecture: "Архітэктура",
      deployment: "Разгортванне",
      monthlyCost: "Штомесячны кошт",
      region: "Рэгіён",
      recommendationSummary: "Кароткае рэзюмэ рэкамендацыі",
      summaryTemplate:
        "Для праекта {projectName} найлепш падыходзіць архітэктура {architectureStyle}. Для рэгіёна {region} рэкамендуецца варыянт разгортвання {deploymentModel}. Выбраны набор кампанентаў улічвае тэхнічны ўзровень каманды {teamTechnicalLevel} і бюджэтны профіль {costProfile}.",
      architectureComponents: "Кампаненты архітэктуры",
      costEstimate: "Ацэнка кошту",
      monthlyCostSentence: "Ацэначны штомесячны кошт інфраструктуры: {value}",
      developmentRoadmap: "Дарожная карта развіцця",
      developmentPlan: "Ацэначны план распрацоўкі",
      regionNotes: "Рэгіянальныя заўвагі",
      risks: "Рызыкі",
      downloadDrawio: "Спампаваць .drawio",
      downloadSvg: "Спампаваць .svg",
      diagramTitleFallback: "Архітэктурны план",
    },
    admin: {
      title: "Адмін-панэль",
      description: "Кіруйце доступам, наладжвайце бяспечныя параметры дэтэрмінаванага рухавіка і праглядайце сістэмную актыўнасць.",
      loading: "Загрузка адміністрацыйнай вобласці...",
      totalUsers: "Усяго карыстальнікаў",
      adminUsers: "Адміністратары",
      generatedPlans: "Згенераваныя планы",
      averageMonthlyEstimate: "Сярэдняя месячная ацэнка",
      popularArchitectures: "Папулярныя архітэктуры",
      popularDeploymentModels: "Папулярныя мадэлі разгортвання",
      commonTechnologyComponents: "Частыя тэхналагічныя кампаненты",
      activeRegions: "Найбольш актыўныя рэгіёны",
      businessTypes: "Тыпы бізнесу",
      stackPatterns: "Патэрны стэкаў",
      recentPlanVolume: "Нядаўні аб'ём планаў",
      noPlansYet: "Планы яшчэ не генераваліся.",
      recentAdminActivity: "Нядаўняя актыўнасць адміністратараў",
      noAdminActivity: "Дзеянні адміністратараў пакуль не зафіксаваны.",
      userManagement: "Кіраванне карыстальнікамі",
      userManagementDescription: "Павышайце і паніжайце ролі, а таксама адсочвайце актыўнасць карыстальнікаў.",
      searchUsers: "Пошук карыстальнікаў",
      searchUsersPlaceholder: "Фільтр па імені, email або Auth0 subject",
      noUsersMatch: "Па бягучым фільтры карыстальнікі не знойдзены.",
      unnamedUser: "Карыстальнік без імя",
      noEmail: "Email не пазначаны",
      projectsCount: "Праекты: {count}",
      joined: "Дата рэгістрацыі: {date}",
      currentAdmin: "Бягучы аўтарызаваны адміністратар",
      editDetails: "Рэдагаваць даныя",
      deleteUser: "Выдаліць карыстальніка",
      deletingUser: "Выдаленне...",
      deleteConfirm: "Выдаліць карыстальніка {name}? Разам з ім будуць выдалены і ўсе захаваныя праекты.",
      deleteTechnology: "\u0412\u044b\u0434\u0430\u043b\u0456\u0446\u044c \u0442\u044d\u0445\u043d\u0430\u043b\u043e\u0433\u0456\u044e",
      deleteTechnologyConfirm: "\u0412\u044b\u0434\u0430\u043b\u0456\u0446\u044c \u0442\u044d\u0445\u043d\u0430\u043b\u043e\u0433\u0456\u044e \"{name}\"?",
      saveChanges: "Захаваць змены",
      savingChanges: "Захаванне...",
      setAsUser: "Зрабіць карыстальнікам",
      makeAdmin: "Зрабіць адміністратарам",
      updating: "Абнаўленне...",
      engineSettings: "Налады рухавіка",
      engineSettingsDescription: "Наладжвайце бяспечныя дэтэрмінаваныя параметры, такія як вагі кошту, рэгіянальныя каэфіцыенты і правілы дарожнай карты.",
      lastUpdatedOn: "Апошняе абнаўленне: {value}",
      updatedByUser: "карыстальнік #{userId}",
      usingDefaultSettings: "Выкарыстоўваюцца налады рухавіка па змаўчанні да першага захавання адміністратарам.",
      regionCostMultipliers: "Рэгіянальныя каэфіцыенты кошту",
      baseArchitectureCosts: "Базавыя кошты архітэктур",
      costModelControls: "Параметры мадэлі кошту",
      featureComponentWeight: "Вага функцыянальнага кампанента",
      monthlyUsersDivider: "Дзельнік месячнай аўдыторыі",
      fastDeliverySurcharge: "Надбаўка за хуткую пастаўку",
      roadmapToggles: "Пераключальнікі дарожнай карты",
      roadmapToggleDescription: "Уключайце або адключайце гэты дэтэрмінаваны крок дарожнай карты для будучых згенераваных планаў.",
      saveEngineSettings: "Захаваць налады рухавіка",
      savingEngineSettings: "Захаванне налад...",
      waitingEngineSettings: "Налады рухавіка з'явяцца тут пасля завяршэння загрузкі адміністрацыйнай вобласці.",
    },
    errors: {
      loadQuestionnaire: "Не ўдалося загрузіць анкету з API.",
      protectedData: "Увайдзіце ў сістэму перад доступам да абароненых даных.",
      openProjects: "Увайдзіце ў сістэму перад адкрыццём захаваных праектаў.",
      adminAccess: "Для адкрыцця адмін-панэлі патрэбныя правы адміністратара.",
      generatePlan: "Увайдзіце ў сістэму перад генерацыяй архітэктурнага плана.",
      auth0Missing: "Auth0 яшчэ не наладжаны. Спачатку дадайце пераменныя асяроддзя Auth0 для frontend і backend.",
    },
  },
};

const questionnaireTranslations = {
  ru: {
    projectName: {
      label: "Название проекта",
      placeholder: "CRM для клиники",
      helpText: "Используется для подписи плана и скачиваемых файлов.",
    },
    projectStage: {
      label: "Стадия проекта",
      helpText: "Помогает сбалансировать простоту решения и будущую масштабируемость.",
    },
    businessType: {
      label: "Тип бизнеса",
      helpText: "Разные продукты лучше соответствуют разным архитектурным паттернам.",
    },
    targetRegion: {
      label: "Целевой регион",
      helpText: "Используется для коэффициентов стоимости и заметок о доступности сервисов.",
    },
    deploymentPreference: {
      label: "Предпочтение по развёртыванию",
      helpText: "Определяет рекомендации по хостингу и управляемым сервисам.",
    },
    monthlyUsers: {
      label: "Оценка месячной аудитории",
      helpText: "Главный сигнал для оценки масштаба и трафика.",
    },
    monthlyBudget: {
      label: "Месячный бюджет на инфраструктуру (USD)",
      helpText: "Ограничивает сложность архитектуры и выбор провайдера.",
    },
    applicationType: {
      label: "Тип приложения",
      helpText: "Определяет, сколько поверхностей доставки должна поддерживать система.",
    },
    coreFeatures: {
      label: "Ключевые функции",
      helpText: "Каждая выбранная функция добавляет архитектурные компоненты.",
    },
    realtimeFeatures: {
      label: "Нужны realtime-возможности",
      helpText: "Добавляет websocket- или pub/sub-компоненты, когда они необходимы.",
    },
    dataSensitivity: {
      label: "Чувствительность данных",
      helpText: "Влияет на безопасность, резервное копирование и контроль доступа.",
    },
    availabilityRequirement: {
      label: "Требование к доступности",
      helpText: "Влияет на мониторинг, резервирование и стратегию failover.",
    },
    expectedGrowth: {
      label: "Ожидаемый рост",
      helpText: "Формирует дорожную карту развития архитектуры.",
    },
    teamTechnicalLevel: {
      label: "Технический уровень команды",
      helpText: "Помогает избежать переусложнения для менее технических команд.",
    },
    needFastDelivery: {
      label: "Нужна быстрая поставка MVP",
      helpText: "Смещает результат в сторону более простых стеков и управляемых сервисов.",
    },
  },
  en: {
    projectName: {
      label: "Project name",
      placeholder: "Clinic CRM",
      helpText: "Used to label the generated plan and downloadable files.",
    },
    projectStage: {
      label: "Project stage",
      helpText: "Helps balance simplicity against future scalability.",
    },
    businessType: {
      label: "Business type",
      helpText: "Different products map to different architectural patterns.",
    },
    targetRegion: {
      label: "Target region",
      helpText: "Used for cost multipliers and service availability notes.",
    },
    deploymentPreference: {
      label: "Deployment preference",
      helpText: "Guides hosting and managed-service recommendations.",
    },
    monthlyUsers: {
      label: "Estimated monthly users",
      helpText: "Primary signal for scale and traffic estimates.",
    },
    monthlyBudget: {
      label: "Monthly infrastructure budget (USD)",
      helpText: "Constrains architecture complexity and provider choice.",
    },
    applicationType: {
      label: "Application type",
      helpText: "Defines how many delivery surfaces the system should support.",
    },
    coreFeatures: {
      label: "Core features",
      helpText: "Each selected feature adds architecture components.",
    },
    realtimeFeatures: {
      label: "Needs realtime features",
      helpText: "Adds websocket or pub/sub components when necessary.",
    },
    dataSensitivity: {
      label: "Data sensitivity",
      helpText: "Shapes security, backups, and access controls.",
    },
    availabilityRequirement: {
      label: "Availability requirement",
      helpText: "Affects monitoring, redundancy, and failover strategy.",
    },
    expectedGrowth: {
      label: "Expected growth",
      helpText: "Generates the migration roadmap.",
    },
    teamTechnicalLevel: {
      label: "Team technical level",
      helpText: "Prevents overengineering for less technical teams.",
    },
    needFastDelivery: {
      label: "Need fast MVP delivery",
      helpText: "Biases the result toward simpler stacks and managed services.",
    },
  },
  be: {
    projectName: {
      label: "Назва праекта",
      placeholder: "CRM для клінікі",
      helpText: "Выкарыстоўваецца для подпісу плана і файлаў для спампоўвання.",
    },
    projectStage: {
      label: "Стадыя праекта",
      helpText: "Дапамагае збалансаваць прастату рашэння і будучую маштабаванасць.",
    },
    businessType: {
      label: "Тып бізнесу",
      helpText: "Розныя прадукты лепш адпавядаюць розным архітэктурным патэрнам.",
    },
    targetRegion: {
      label: "Мэтавы рэгіён",
      helpText: "Выкарыстоўваецца для каэфіцыентаў кошту і заўваг аб даступнасці сэрвісаў.",
    },
    deploymentPreference: {
      label: "Перавага разгортвання",
      helpText: "Вызначае рэкамендацыі па хостынгу і кіраваных сэрвісах.",
    },
    monthlyUsers: {
      label: "Ацэначная месячная аўдыторыя",
      helpText: "Галоўны сігнал для ацэнкі маштабу і трафіку.",
    },
    monthlyBudget: {
      label: "Месячны бюджэт на інфраструктуру (USD)",
      helpText: "Абмяжоўвае складанасць архітэктуры і выбар правайдара.",
    },
    applicationType: {
      label: "Тып прыкладання",
      helpText: "Вызначае, колькі паверхняў дастаўкі павінна падтрымліваць сістэма.",
    },
    coreFeatures: {
      label: "Ключавыя функцыі",
      helpText: "Кожная выбраная функцыя дадае архітэктурныя кампаненты.",
    },
    realtimeFeatures: {
      label: "Патрэбныя realtime-магчымасці",
      helpText: "Дадае websocket- або pub/sub-кампаненты, калі яны патрэбныя.",
    },
    dataSensitivity: {
      label: "Адчувальнасць даных",
      helpText: "Уплывае на бяспеку, рэзервовае капіраванне і кантроль доступу.",
    },
    availabilityRequirement: {
      label: "Патрабаванне да даступнасці",
      helpText: "Уплывае на маніторынг, рэзерваванне і стратэгію failover.",
    },
    expectedGrowth: {
      label: "Чаканы рост",
      helpText: "Фарміруе дарожную карту развіцця архітэктуры.",
    },
    teamTechnicalLevel: {
      label: "Тэхнічны ўзровень каманды",
      helpText: "Дапамагае пазбегнуць пераўскладнення для менш тэхнічных каманд.",
    },
    needFastDelivery: {
      label: "Патрэбна хуткая пастаўка MVP",
      helpText: "Зрушвае вынік у бок больш простых стэкаў і кіраваных сэрвісаў.",
    },
  },
};

const valueLabels = {
  ru: {
    idea: "Идея",
    prototype: "Прототип",
    mvp: "MVP",
    "growing-product": "Растущий продукт",
    saas: "SaaS",
    "e-commerce": "E-commerce",
    marketplace: "Маркетплейс",
    "social-platform": "Социальная платформа",
    "internal-system": "Внутренняя система",
    "content-platform": "Контент-платформа",
    fintech: "\u0424\u0438\u043d\u0442\u0435\u0445",
    healthcare: "\u0417\u0434\u0440\u0430\u0432\u043e\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435",
    edtech: "EdTech",
    "north-america": "Северная Америка",
    europe: "Европа",
    asia: "Азия",
    global: "Глобальный рынок",
    cloud: "Облако",
    "on-premise": "On-premise",
    hybrid: "Гибридный",
    "no-preference": "Без предпочтений",
    "managed-cloud": "Управляемое облако",
    "self-managed-cloud": "\u0421\u0430\u043c\u043e\u0441\u0442\u043e\u044f\u0442\u0435\u043b\u044c\u043d\u043e \u0443\u043f\u0440\u0430\u0432\u043b\u044f\u0435\u043c\u043e\u0435 \u043e\u0431\u043b\u0430\u043a\u043e",
    "web-app": "Веб-приложение",
    "mobile-backend": "Backend для мобильного приложения",
    "api-platform": "API-платформа",
    "web-and-mobile": "??? ? ????????? ??????????",
    "mobile-app": "\u041c\u043e\u0431\u0438\u043b\u044c\u043d\u043e\u0435 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435",
    "integrated-system": "\u0418\u043d\u0442\u0435\u0433\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u0441\u0438\u0441\u0442\u0435\u043c\u0430",
    "dbms-platform": "DBMS-\u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430",
    "native-mobile-app": "\u041d\u0430\u0442\u0438\u0432\u043d\u043e\u0435 \u043c\u043e\u0431\u0438\u043b\u044c\u043d\u043e\u0435 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435",
    "cross-platform-mobile": "\u041a\u0440\u043e\u0441\u0441-\u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0435\u043d\u043d\u043e\u0435 \u043c\u043e\u0431\u0438\u043b\u044c\u043d\u043e\u0435 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435",
    "iot-platform": "IoT-\u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430",
    authentication: "Аутентификация",
    payments: "Платежи",
    "file-upload": "Загрузка файлов",
    search: "Поиск",
    "admin-panel": "Админ-панель",
    notifications: "Уведомления",
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
    basic: "Базовый",
    important: "Важный",
    critical: "Критичный",
    slow: "Медленный",
    moderate: "Умеренный",
    fast: "Быстрый",
    unpredictable: "Непредсказуемый",
    monolith: "Монолит",
    "modular-monolith": "Модульный монолит",
    "scalable-services": "Масштабируемые сервисы",
    minimal: "Минимальный",
    balanced: "Сбалансированный",
    expanded: "Расширенный",
    user: "Пользователь",
    admin: "Администратор",
    compute: "Вычисления",
    database: "База данных",
    storage: "Хранение",
    monitoring: "Мониторинг",
    networking: "Сеть",
  },
  en: {
    idea: "Idea",
    prototype: "Prototype",
    mvp: "MVP",
    "growing-product": "Growing product",
    saas: "SaaS",
    "e-commerce": "E-commerce",
    marketplace: "Marketplace",
    "social-platform": "Social platform",
    "internal-system": "Internal system",
    "content-platform": "Content platform",
    fintech: "Fintech",
    healthcare: "Healthcare",
    edtech: "EdTech",
    "north-america": "North America",
    europe: "Europe",
    asia: "Asia",
    global: "Global",
    cloud: "Cloud",
    "on-premise": "On-premise",
    hybrid: "Hybrid",
    "no-preference": "No preference",
    "managed-cloud": "Managed cloud",
    "self-managed-cloud": "Self-managed cloud",
    "web-app": "Web app",
    "mobile-backend": "Mobile backend",
    "api-platform": "API platform",
    "web-and-mobile": "Web and mobile",
    "mobile-app": "Mobile app",
    "integrated-system": "Integrated system",
    "dbms-platform": "DBMS platform",
    "native-mobile-app": "Native mobile app",
    "cross-platform-mobile": "Cross-platform mobile app",
    "iot-platform": "IoT platform",
    authentication: "Authentication",
    payments: "Payments",
    "file-upload": "File upload",
    search: "Search",
    "admin-panel": "Admin panel",
    notifications: "Notifications",
    low: "Low",
    medium: "Medium",
    high: "High",
    basic: "Basic",
    important: "Important",
    critical: "Critical",
    slow: "Slow",
    moderate: "Moderate",
    fast: "Fast",
    unpredictable: "Unpredictable",
    monolith: "Monolith",
    "modular-monolith": "Modular monolith",
    "scalable-services": "Scalable services",
    minimal: "Minimal",
    balanced: "Balanced",
    expanded: "Expanded",
    user: "User",
    admin: "Admin",
    compute: "Compute",
    database: "Database",
    storage: "Storage",
    monitoring: "Monitoring",
    networking: "Networking",
  },
  be: {
    idea: "Ідэя",
    prototype: "Прататып",
    mvp: "MVP",
    "growing-product": "Прадукт, што расце",
    saas: "SaaS",
    "e-commerce": "E-commerce",
    marketplace: "Маркетплэйс",
    "social-platform": "Сацыяльная платформа",
    "internal-system": "Унутраная сістэма",
    "content-platform": "Кантэнт-платформа",
    fintech: "\u0424\u0456\u043d\u0442\u044d\u0445",
    healthcare: "\u0410\u0445\u043e\u0432\u0430 \u0437\u0434\u0430\u0440\u043e\u045e\u044f",
    edtech: "EdTech",
    "north-america": "Паўночная Амерыка",
    europe: "Еўропа",
    asia: "Азія",
    global: "Глабальны рынак",
    cloud: "Воблака",
    "on-premise": "On-premise",
    hybrid: "Гібрыдны",
    "no-preference": "Без пераваг",
    "managed-cloud": "Кіраванае воблака",
    "self-managed-cloud": "\u0421\u0430\u043c\u0430\u0441\u0442\u043e\u0439\u043d\u0430 \u043a\u0456\u0440\u0430\u0432\u0430\u043d\u0430\u0435 \u0432\u043e\u0431\u043b\u0430\u043a\u0430",
    "web-app": "Вэб-прыкладанне",
    "mobile-backend": "Backend для мабільнага прыкладання",
    "api-platform": "API-платформа",
    "web-and-mobile": "??? ? ????????? ???????????",
    "mobile-app": "\u041c\u0430\u0431\u0456\u043b\u044c\u043d\u0430\u0435 \u043f\u0440\u044b\u043a\u043b\u0430\u0434\u0430\u043d\u043d\u0435",
    "integrated-system": "\u0406\u043d\u0442\u044d\u0433\u0440\u0430\u0432\u0430\u043d\u0430\u044f \u0441\u0456\u0441\u0442\u044d\u043c\u0430",
    "dbms-platform": "DBMS-\u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430",
    "native-mobile-app": "\u041d\u0430\u0442\u044b\u045e\u043d\u0430\u0435 \u043c\u0430\u0431\u0456\u043b\u044c\u043d\u0430\u0435 \u043f\u0440\u044b\u043a\u043b\u0430\u0434\u0430\u043d\u043d\u0435",
    "cross-platform-mobile": "\u041a\u0440\u043e\u0441-\u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0435\u043d\u043d\u0430\u0435 \u043c\u0430\u0431\u0456\u043b\u044c\u043d\u0430\u0435 \u043f\u0440\u044b\u043a\u043b\u0430\u0434\u0430\u043d\u043d\u0435",
    "iot-platform": "IoT-\u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430",
    authentication: "Аўтэнтыфікацыя",
    payments: "Плацяжы",
    "file-upload": "Загрузка файлаў",
    search: "Пошук",
    "admin-panel": "Адмін-панэль",
    notifications: "Апавяшчэнні",
    low: "Нізкі",
    medium: "Сярэдні",
    high: "Высокі",
    basic: "Базавы",
    important: "Важны",
    critical: "Крытычны",
    slow: "Павольны",
    moderate: "Умераны",
    fast: "Хуткі",
    unpredictable: "Непрадказальны",
    monolith: "Маналіт",
    "modular-monolith": "Модульны маналіт",
    "scalable-services": "Маштабаваныя сэрвісы",
    minimal: "Мінімальны",
    balanced: "Збалансаваны",
    expanded: "Пашыраны",
    user: "Карыстальнік",
    admin: "Адміністратар",
    compute: "Вылічэнні",
    database: "База даных",
    storage: "Сховішча",
    monitoring: "Маніторынг",
    networking: "Сетка",
  },
};

const componentLabels = {
  ru: {
    "mobile-client-support": "Поддержка мобильного клиента",
    "api-consumer-layer": "Слой API-потребителей",
    "react-frontend": "React-фронтенд",
    nginx: "Nginx",
    "nodejs-express-api": "Node.js + Express API",
    postgresql: "PostgreSQL",
    cdn: "CDN",
    "worker-service": "Фоновый worker-сервис",
    "load-balancer": "Балансировщик нагрузки",
    "auth-module": "Модуль аутентификации",
    "payment-gateway": "Платёжный шлюз",
    "audit-log": "Журнал аудита",
    "object-storage": "Object Storage",
    "search-layer": "Поисковый слой",
    "notification-service": "Сервис уведомлений",
    "job-queue": "Очередь задач",
    rbac: "RBAC",
    "admin-ui": "Интерфейс администратора",
    "websocket-gateway": "WebSocket-шлюз",
    "redis-pubsub": "Redis / PubSub",
    https: "HTTPS",
    "basic-backups": "Базовые бэкапы",
    "protected-fields": "Защищённые поля",
    "strong-access-control": "Усиленный контроль доступа",
    "encryption-at-rest": "Шифрование данных at rest",
    "detailed-audit-log": "Детализированный аудит",
    "strict-access-control": "Строгий контроль доступа",
    "health-checks": "Проверки здоровья",
    monitoring: "Мониторинг",
    "automated-backups": "Автоматические бэкапы",
    redundancy: "Резервирование",
    failover: "Failover",
    "production-db-setup": "Production-конфигурация БД",
  },
  en: {
    "mobile-client-support": "Mobile client support",
    "api-consumer-layer": "API consumer layer",
    "react-frontend": "React frontend",
    nginx: "Nginx",
    "nodejs-express-api": "Node.js + Express API",
    postgresql: "PostgreSQL",
    cdn: "CDN",
    "worker-service": "Worker service",
    "load-balancer": "Load balancer",
    "auth-module": "Auth module",
    "payment-gateway": "Payment gateway",
    "audit-log": "Audit log",
    "object-storage": "Object storage",
    "search-layer": "Search layer",
    "notification-service": "Notification service",
    "job-queue": "Job queue",
    rbac: "RBAC",
    "admin-ui": "Admin UI",
    "websocket-gateway": "WebSocket gateway",
    "redis-pubsub": "Redis / PubSub",
    https: "HTTPS",
    "basic-backups": "Basic backups",
    "protected-fields": "Protected fields",
    "strong-access-control": "Strong access control",
    "encryption-at-rest": "Encryption at rest",
    "detailed-audit-log": "Detailed audit log",
    "strict-access-control": "Strict access control",
    "health-checks": "Health checks",
    monitoring: "Monitoring",
    "automated-backups": "Automated backups",
    redundancy: "Redundancy",
    failover: "Failover",
    "production-db-setup": "Production DB setup",
  },
  be: {
    "mobile-client-support": "Падтрымка мабільнага кліента",
    "api-consumer-layer": "Слой API-спажыўцоў",
    "react-frontend": "React-франтэнд",
    nginx: "Nginx",
    "nodejs-express-api": "Node.js + Express API",
    postgresql: "PostgreSQL",
    cdn: "CDN",
    "worker-service": "Фонавы worker-сэрвіс",
    "load-balancer": "Балансавальнік нагрузкі",
    "auth-module": "Модуль аўтэнтыфікацыі",
    "payment-gateway": "Плацежны шлюз",
    "audit-log": "Журнал аўдыту",
    "object-storage": "Object Storage",
    "search-layer": "Пошукавы слой",
    "notification-service": "Сэрвіс апавяшчэнняў",
    "job-queue": "Чарга задач",
    rbac: "RBAC",
    "admin-ui": "Інтэрфейс адміністратара",
    "websocket-gateway": "WebSocket-шлюз",
    "redis-pubsub": "Redis / PubSub",
    https: "HTTPS",
    "basic-backups": "Базавыя рэзервовыя копіі",
    "protected-fields": "Абароненыя палі",
    "strong-access-control": "Узмоцнены кантроль доступу",
    "encryption-at-rest": "Шыфраванне даных at rest",
    "detailed-audit-log": "Дэталёвы аўдыт",
    "strict-access-control": "Строгі кантроль доступу",
    "health-checks": "Праверкі здароўя",
    monitoring: "Маніторынг",
    "automated-backups": "Аўтаматычныя рэзервовыя копіі",
    redundancy: "Рэзерваванне",
    failover: "Failover",
    "production-db-setup": "Production-канфігурацыя БД",
  },
};

const fixedTextTranslations = {
  ru: {
    "Start with a simple deployable monolith and scale only after real usage appears.":
      "Начните с простого развёртываемого монолита и масштабируйтесь только после появления реальной нагрузки.",
    "Organize the backend as modules so it can later be split with minimal rework.":
      "Организуйте backend как набор модулей, чтобы позже его можно было разделить с минимальными доработками.",
    "Introduce caching when repeat reads become significant.":
      "Добавьте кэширование, когда повторные чтения станут заметной нагрузкой.",
    "Move background work to queues as asynchronous workloads grow.":
      "Переносите фоновые задачи в очереди по мере роста асинхронной нагрузки.",
    "Prepare horizontal scaling and stateless API deployment.":
      "Подготовьте горизонтальное масштабирование и stateless-развёртывание API.",
    "Prioritize launch speed over early architectural sophistication.":
      "Отдайте приоритет скорости запуска, а не раннему архитектурному усложнению.",
    "Validate the MVP with one deployment environment before investing in advanced infrastructure.":
      "Проверьте MVP в одной среде развёртывания, прежде чем инвестировать в сложную инфраструктуру.",
    "Add storage lifecycle policies when user-generated content volume starts growing.":
      "Добавьте lifecycle-политики хранения, когда объём пользовательского контента начнёт расти.",
    "Stress-test realtime traffic and move stateful communication behind dedicated gateways as usage increases.":
      "Проведите стресс-тест realtime-трафика и вынесите stateful-коммуникацию за отдельные шлюзы по мере роста использования.",
    "Budget is likely too low for the expected traffic level.":
      "Бюджет, вероятно, слишком мал для ожидаемого уровня трафика.",
    "Critical availability with low team experience and fast delivery creates operational risk.":
      "Критичная доступность при низком опыте команды и быстрой поставке создаёт операционный риск.",
    "On-premise hosting will usually slow down MVP delivery.":
      "On-premise-хостинг обычно замедляет выпуск MVP.",
    "High-sensitivity workloads usually need a larger budget for secure operations.":
      "Нагрузки с высокой чувствительностью данных обычно требуют большего бюджета для безопасной эксплуатации.",
    "Strong managed cloud support.": "Сильная поддержка управляемых облачных сервисов.",
    "Baseline cost region for estimates.": "Базовый регион стоимости для оценок.",
    "Slightly higher estimated hosting costs.": "Оценочные расходы на хостинг немного выше.",
    "Useful when planning for EU data residency.": "Полезно при планировании хранения данных в ЕС.",
    "Costs vary by provider and target country.": "Стоимость зависит от провайдера и целевой страны.",
    "Latency planning may matter for multi-country deployment.": "При развертывании в нескольких странах важно учитывать задержки.",
    "Global delivery usually benefits from CDN usage.": "Глобальная доставка обычно выигрывает от использования CDN.",
    "Multi-region concerns increase operational complexity.": "Мультирегиональность повышает операционную сложность.",
    "Phase 1": "Этап 1",
    "Phase 2": "Этап 2",
    "Phase 3": "Этап 3",
    "Questionnaire and planning API": "Анкета и API планирования",
    "Collect requirements and generate deterministic architecture recommendations.":
      "Собрать требования и сгенерировать детерминированные архитектурные рекомендации.",
    "Diagram export and saved plans": "Экспорт диаграмм и сохранённые планы",
    "Allow users to download diagrams and compare previous results.":
      "Позволить пользователям скачивать диаграммы и сравнивать предыдущие результаты.",
    "External region data sync": "Внешняя синхронизация региональных данных",
    "Refresh cost and service availability data from open APIs.":
      "Обновлять данные о стоимости и доступности сервисов из открытых API.",
    "Idea and prototype validation step": "Шаг валидации идеи и прототипа",
    "File upload lifecycle guidance": "Рекомендации по жизненному циклу загрузки файлов",
    "Realtime stress-test guidance": "Рекомендации по стресс-тесту realtime",
    "user.role.updated": "Роль пользователя изменена",
    "engine_settings.updated": "Настройки движка изменены",
    "user.deleted": "Пользователь удалён",
    "user.profile.updated": "Данные пользователя изменены",
    "Client Application": "Клиентское приложение",
    "Web + Mobile Clients": "Веб + мобильные клиенты",
    "CDN / Reverse Proxy": "CDN / Reverse Proxy",
    "Node.js + Express API": "Node.js + Express API",
    "PostgreSQL": "PostgreSQL",
    "Object Storage": "Object Storage",
    "Static Assets / CDN": "Статические ресурсы / CDN",
    "Realtime Gateway": "Realtime-шлюз",
    "Background Jobs": "Фоновые задачи",
    "Redis / PubSub": "Redis / PubSub",
    "Requests": "Запросы",
    "Queries": "Запросы к БД",
    "Uploads": "Загрузки",
    "Assets": "Статика",
    "Realtime": "Realtime",
    "Events": "События",
    "Tasks": "Задачи",
    "Cache": "Кэш",
    "Browser": "Браузер",
    "Deployment Environment": "Среда развертывания",
    "Service Stack": "Стек сервисов",
    "Ingress Container": "Ingress-контейнер",
    "Application Container": "Контейнер приложения",
    "Application Service": "Сервис приложения",
    "Database Container": "Контейнер базы данных",
    "React Frontend": "React-фронтенд",
    "Mobile Client Support": "Поддержка мобильных клиентов",
    "API Integration": "Интеграция API",
    "API Consumer Layer": "Слой потребителей API",
    "Partner / Internal Clients": "Партнерские / внутренние клиенты",
    "HTTPS Termination": "Терминация HTTPS",
    "Managed Edge": "Управляемый edge-слой",
    "Monolith Service": "Монолитный сервис",
    "Modular Monolith": "Модульный монолит",
    "Scalable Services": "Масштабируемые сервисы",
    "Auth Module": "Модуль аутентификации",
    "Notification Service": "Сервис уведомлений",
    "Payment Gateway": "Платежный шлюз",
    "RBAC / Admin UI": "RBAC / админ-интерфейс",
    "Search Layer": "Поисковый слой",
    "Monitoring": "Мониторинг",
    "Backups": "Резервные копии",
    "HTTPS": "HTTPS",
  },
  en: {
    "Start with a simple deployable monolith and scale only after real usage appears.":
      "Start with a simple deployable monolith and scale only after real usage appears.",
    "Organize the backend as modules so it can later be split with minimal rework.":
      "Organize the backend as modules so it can later be split with minimal rework.",
    "Introduce caching when repeat reads become significant.":
      "Introduce caching when repeat reads become significant.",
    "Move background work to queues as asynchronous workloads grow.":
      "Move background work to queues as asynchronous workloads grow.",
    "Prepare horizontal scaling and stateless API deployment.":
      "Prepare horizontal scaling and stateless API deployment.",
    "Prioritize launch speed over early architectural sophistication.":
      "Prioritize launch speed over early architectural sophistication.",
    "Validate the MVP with one deployment environment before investing in advanced infrastructure.":
      "Validate the MVP with one deployment environment before investing in advanced infrastructure.",
    "Add storage lifecycle policies when user-generated content volume starts growing.":
      "Add storage lifecycle policies when user-generated content volume starts growing.",
    "Stress-test realtime traffic and move stateful communication behind dedicated gateways as usage increases.":
      "Stress-test realtime traffic and move stateful communication behind dedicated gateways as usage increases.",
    "Budget is likely too low for the expected traffic level.":
      "Budget is likely too low for the expected traffic level.",
    "Critical availability with low team experience and fast delivery creates operational risk.":
      "Critical availability with low team experience and fast delivery creates operational risk.",
    "On-premise hosting will usually slow down MVP delivery.":
      "On-premise hosting will usually slow down MVP delivery.",
    "High-sensitivity workloads usually need a larger budget for secure operations.":
      "High-sensitivity workloads usually need a larger budget for secure operations.",
    "Strong managed cloud support.": "Strong managed cloud support.",
    "Baseline cost region for estimates.": "Baseline cost region for estimates.",
    "Slightly higher estimated hosting costs.": "Slightly higher estimated hosting costs.",
    "Useful when planning for EU data residency.": "Useful when planning for EU data residency.",
    "Costs vary by provider and target country.": "Costs vary by provider and target country.",
    "Latency planning may matter for multi-country deployment.":
      "Latency planning may matter for multi-country deployment.",
    "Global delivery usually benefits from CDN usage.": "Global delivery usually benefits from CDN usage.",
    "Multi-region concerns increase operational complexity.":
      "Multi-region concerns increase operational complexity.",
    "Phase 1": "Phase 1",
    "Phase 2": "Phase 2",
    "Phase 3": "Phase 3",
    "Questionnaire and planning API": "Questionnaire and planning API",
    "Collect requirements and generate deterministic architecture recommendations.":
      "Collect requirements and generate deterministic architecture recommendations.",
    "Diagram export and saved plans": "Diagram export and saved plans",
    "Allow users to download diagrams and compare previous results.":
      "Allow users to download diagrams and compare previous results.",
    "External region data sync": "External region data sync",
    "Refresh cost and service availability data from open APIs.":
      "Refresh cost and service availability data from open APIs.",
    "Idea and prototype validation step": "Idea and prototype validation step",
    "File upload lifecycle guidance": "File upload lifecycle guidance",
    "Realtime stress-test guidance": "Realtime stress-test guidance",
    "user.role.updated": "User role updated",
    "engine_settings.updated": "Engine settings updated",
    "user.deleted": "User deleted",
    "user.profile.updated": "User profile updated",
    "Client Application": "Client Application",
    "Web + Mobile Clients": "Web + Mobile Clients",
    "CDN / Reverse Proxy": "CDN / Reverse Proxy",
    "Node.js + Express API": "Node.js + Express API",
    "PostgreSQL": "PostgreSQL",
    "Object Storage": "Object Storage",
    "Static Assets / CDN": "Static Assets / CDN",
    "Realtime Gateway": "Realtime Gateway",
    "Background Jobs": "Background Jobs",
    "Redis / PubSub": "Redis / PubSub",
    "Requests": "Requests",
    "Queries": "Queries",
    "Uploads": "Uploads",
    "Assets": "Assets",
    "Realtime": "Realtime",
    "Events": "Events",
    "Tasks": "Tasks",
    "Cache": "Cache",
    "Browser": "Browser",
    "Deployment Environment": "Deployment Environment",
    "Service Stack": "Service Stack",
    "Ingress Container": "Ingress Container",
    "Application Container": "Application Container",
    "Application Service": "Application Service",
    "Database Container": "Database Container",
    "React Frontend": "React Frontend",
    "Mobile Client Support": "Mobile Client Support",
    "API Integration": "API Integration",
    "API Consumer Layer": "API Consumer Layer",
    "Partner / Internal Clients": "Partner / Internal Clients",
    "HTTPS Termination": "HTTPS Termination",
    "Managed Edge": "Managed Edge",
    "Monolith Service": "Monolith Service",
    "Modular Monolith": "Modular Monolith",
    "Scalable Services": "Scalable Services",
    "Auth Module": "Auth Module",
    "Notification Service": "Notification Service",
    "Payment Gateway": "Payment Gateway",
    "RBAC / Admin UI": "RBAC / Admin UI",
    "Search Layer": "Search Layer",
    "Monitoring": "Monitoring",
    "Backups": "Backups",
    "HTTPS": "HTTPS",
  },
  be: {
    "Start with a simple deployable monolith and scale only after real usage appears.":
      "Пачніце з простага маналіту, які можна разгарнуць, і маштабуйцеся толькі пасля з'яўлення рэальнай нагрузкі.",
    "Organize the backend as modules so it can later be split with minimal rework.":
      "Арганізуйце backend як набор модуляў, каб пазней яго можна было падзяліць з мінімальнымі дапрацоўкамі.",
    "Introduce caching when repeat reads become significant.":
      "Дадайце кэшаванне, калі паўторныя чытанні стануць прыкметнай нагрузкай.",
    "Move background work to queues as asynchronous workloads grow.":
      "Пераносіце фонавыя задачы ў чаргі па меры росту асінхроннай нагрузкі.",
    "Prepare horizontal scaling and stateless API deployment.":
      "Падрыхтуйце гарызантальнае маштабаванне і stateless-разгортванне API.",
    "Prioritize launch speed over early architectural sophistication.":
      "Аддайце прыярытэт хуткасці запуску, а не ранняму архітэктурнаму ўскладненню.",
    "Validate the MVP with one deployment environment before investing in advanced infrastructure.":
      "Праверце MVP у адным асяроддзі разгортвання, перш чым інвеставаць у складаную інфраструктуру.",
    "Add storage lifecycle policies when user-generated content volume starts growing.":
      "Дадайце lifecycle-палітыкі захоўвання, калі аб'ём карыстальніцкага кантэнту пачне расці.",
    "Stress-test realtime traffic and move stateful communication behind dedicated gateways as usage increases.":
      "Правядзіце стрэс-тэст realtime-трафіку і вынесіце stateful-камунікацыю за асобныя шлюзы па меры росту выкарыстання.",
    "Budget is likely too low for the expected traffic level.":
      "Бюджэт, верагодна, занадта малы для чаканага ўзроўню трафіку.",
    "Critical availability with low team experience and fast delivery creates operational risk.":
      "Крытычная даступнасць пры нізкім вопыце каманды і хуткай пастаўцы стварае аперацыйную рызыку.",
    "On-premise hosting will usually slow down MVP delivery.":
      "On-premise-хостынг звычайна запавольвае выпуск MVP.",
    "High-sensitivity workloads usually need a larger budget for secure operations.":
      "Нагрузкі з высокай адчувальнасцю даных звычайна патрабуюць большага бюджэту для бяспечнай эксплуатацыі.",
    "Strong managed cloud support.": "Моцная падтрымка кіраваных воблачных сэрвісаў.",
    "Baseline cost region for estimates.": "Базавы рэгіён кошту для ацэнак.",
    "Slightly higher estimated hosting costs.": "Ацэначныя выдаткі на хостынг крыху вышэйшыя.",
    "Useful when planning for EU data residency.": "Карысна пры планаванні захавання даных у ЕС.",
    "Costs vary by provider and target country.": "Кошт залежыць ад правайдара і мэтавай краіны.",
    "Latency planning may matter for multi-country deployment.": "Пры разгортванні ў некалькіх краінах важна ўлічваць затрымкі.",
    "Global delivery usually benefits from CDN usage.": "Глабальная дастаўка звычайна выйграе ад выкарыстання CDN.",
    "Multi-region concerns increase operational complexity.": "Мультырэгіянальнасць павышае аперацыйную складанасць.",
    "Phase 1": "Этап 1",
    "Phase 2": "Этап 2",
    "Phase 3": "Этап 3",
    "Questionnaire and planning API": "Анкета і API планавання",
    "Collect requirements and generate deterministic architecture recommendations.":
      "Сабраць патрабаванні і згенераваць дэтэрмінаваныя архітэктурныя рэкамендацыі.",
    "Diagram export and saved plans": "Экспарт дыяграм і захаваныя планы",
    "Allow users to download diagrams and compare previous results.":
      "Дазволіць карыстальнікам спампоўваць дыяграмы і параўноўваць папярэднія вынікі.",
    "External region data sync": "Знешняя сінхранізацыя рэгіянальных даных",
    "Refresh cost and service availability data from open APIs.":
      "Абнаўляць даныя аб кошце і даступнасці сэрвісаў з адкрытых API.",
    "Idea and prototype validation step": "Крок валідацыі ідэі і прататыпа",
    "File upload lifecycle guidance": "Рэкамендацыі па жыццёвым цыкле загрузкі файлаў",
    "Realtime stress-test guidance": "Рэкамендацыі па стрэс-тэсце realtime",
    "user.role.updated": "Роля карыстальніка зменена",
    "engine_settings.updated": "Налады рухавіка зменены",
    "user.deleted": "Карыстальнік выдалены",
    "user.profile.updated": "Даныя карыстальніка зменены",
    "Client Application": "Кліенцкае прыкладанне",
    "Web + Mobile Clients": "Вэб + мабільныя кліенты",
    "CDN / Reverse Proxy": "CDN / Reverse Proxy",
    "Node.js + Express API": "Node.js + Express API",
    "PostgreSQL": "PostgreSQL",
    "Object Storage": "Object Storage",
    "Static Assets / CDN": "Статычныя рэсурсы / CDN",
    "Realtime Gateway": "Realtime-шлюз",
    "Background Jobs": "Фонавыя задачы",
    "Redis / PubSub": "Redis / PubSub",
    "Requests": "Запыты",
    "Queries": "Запыты да БД",
    "Uploads": "Загрузкі",
    "Assets": "Статыка",
    "Realtime": "Realtime",
    "Events": "Падзеі",
    "Tasks": "Задачы",
    "Cache": "Кэш",
    "Browser": "Браўзер",
    "Deployment Environment": "Асяроддзе разгортвання",
    "Service Stack": "Стэк сэрвісаў",
    "Ingress Container": "Ingress-кантэйнер",
    "Application Container": "Кантэйнер прыкладання",
    "Application Service": "Сэрвіс прыкладання",
    "Database Container": "Кантэйнер базы дадзеных",
    "React Frontend": "React-фронтэнд",
    "Mobile Client Support": "Падтрымка мабільных кліентаў",
    "API Integration": "Інтэграцыя API",
    "API Consumer Layer": "Слой спажыўцоў API",
    "Partner / Internal Clients": "Партнёрскія / унутраныя кліенты",
    "HTTPS Termination": "HTTPS-тэрмінацыя",
    "Managed Edge": "Кіраваны edge-слой",
    "Monolith Service": "Маналітны сэрвіс",
    "Modular Monolith": "Модульны маналіт",
    "Scalable Services": "Маштабаваныя сэрвісы",
    "Auth Module": "Модуль аўтэнтыфікацыі",
    "Notification Service": "Сэрвіс апавяшчэнняў",
    "Payment Gateway": "Аплатны шлюз",
    "RBAC / Admin UI": "RBAC / адмін-інтэрфейс",
    "Search Layer": "Пошукавы слой",
    "Monitoring": "Маніторынг",
    "Backups": "Рэзервовыя копіі",
    "HTTPS": "HTTPS",
  },
};

const I18nContext = createContext(null);

function getInitialLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
  return LANGUAGE_OPTIONS.some((option) => option.code === savedLanguage) ? savedLanguage : DEFAULT_LANGUAGE;
}

function humanizeValue(value) {
  return String(value)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolvePath(target, path) {
  return path.split(".").reduce((current, key) => current?.[key], target);
}

function interpolate(template, variables = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(variables[key] ?? ""));
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const locale = LOCALE_BY_LANGUAGE[language] || LOCALE_BY_LANGUAGE[DEFAULT_LANGUAGE];

  function t(path, variables) {
    const template =
      resolvePath(messages[language], path) ??
      resolvePath(messages[DEFAULT_LANGUAGE], path) ??
      path;

    return interpolate(template, variables);
  }

  function getValueLabel(value) {
    return valueLabels[language]?.[value] ?? valueLabels[DEFAULT_LANGUAGE]?.[value] ?? humanizeValue(value);
  }

  function getComponentLabel(component) {
    return componentLabels[language]?.[component] ?? componentLabels[DEFAULT_LANGUAGE]?.[component] ?? humanizeValue(component);
  }

  function translateFixedText(text) {
    return fixedTextTranslations[language]?.[text] ?? fixedTextTranslations[DEFAULT_LANGUAGE]?.[text] ?? text;
  }

  function getQuestionnaireField(field) {
    const localizedField =
      questionnaireTranslations[language]?.[field.id] ??
      questionnaireTranslations[DEFAULT_LANGUAGE]?.[field.id] ??
      {};

    return {
      ...field,
      label: localizedField.label ?? field.label,
      placeholder: localizedField.placeholder ?? field.placeholder,
      helpText: localizedField.helpText ?? field.helpText,
    };
  }

  function formatDate(value) {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value ?? "");
    }

    return new Intl.DateTimeFormat(locale).format(date);
  }

  function formatDateTime(value) {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value ?? "");
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  function formatCurrency(value, currency = "USD") {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return String(value ?? "");
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function getRoleLabel(role) {
    return getValueLabel(role || "user");
  }

  function getProjectSummary(project) {
    const architectureStyle = getValueLabel(project.architectureStyle || "monolith");
    const deploymentModel = project.deploymentModel ? getValueLabel(project.deploymentModel) : null;
    const region = project.targetRegion ? getValueLabel(project.targetRegion) : null;

    if (deploymentModel && region) {
      return t("projects.cardSummaryFull", {
        architectureStyle,
        deploymentModel,
        region,
      });
    }

    if (deploymentModel) {
      return t("projects.cardSummaryShort", {
        architectureStyle,
        deploymentModel,
      });
    }

    return project.summary || "";
  }

  function getPlanSummary(plan) {
    return t("plan.summaryTemplate", {
      projectName: plan?.input?.projectName || t("plan.diagramTitleFallback"),
      architectureStyle: getValueLabel(plan?.recommendation?.architectureStyle || "monolith"),
      deploymentModel: getValueLabel(plan?.recommendation?.deploymentModel || "cloud"),
      region: getValueLabel(plan?.regionProfile?.code || plan?.input?.targetRegion || "north-america"),
      teamTechnicalLevel: getValueLabel(plan?.input?.teamTechnicalLevel || "medium"),
      costProfile: getValueLabel(plan?.recommendation?.costProfile || "balanced"),
    });
  }

  const value = {
    formatCurrency,
    formatDate,
    formatDateTime,
    getComponentLabel,
    getPlanSummary,
    getProjectSummary,
    getQuestionnaireField,
    getRoleLabel,
    getValueLabel,
    language,
    locale,
    setLanguage,
    t,
    translateFixedText,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }

  return context;
}
