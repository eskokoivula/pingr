export type TelegramUser = {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}

export type AppEnv = {
  Variables: {
    telegramUser: TelegramUser
  }
}
