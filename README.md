# Telegram Shop Bot

## Настройка

1. Установи зависимости:
   ```
   npm install
   ```
2. Скопируй `.env.example` в `.env`:
   ```
   cp .env.example .env
   ```
3. Заполни `.env` своими данными (новый токен бота, твой ID, ссылку на каталог).
4. Запусти бота:
   ```
   npm start
   ```

## Загрузка на GitHub

```
git init
git add .
git commit -m "Первый коммит"
git branch -M main
git remote add origin https://github.com/ТВОЙ_ЮЗЕРНЕЙМ/НАЗВАНИЕ_РЕПО.git
git push -u origin main
```

Файл `.env` в репозиторий не попадёт — он в `.gitignore`. Заливается только `.env.example` (без реальных секретов).

⚠️ Если старый токен бота уже когда-то публиковался — обязательно отзови его через @BotFather (`/revoke` или `/mytoken` → Revoke Token) и впиши новый в `.env`.
