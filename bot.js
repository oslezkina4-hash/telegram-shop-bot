require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

// ==================== НАСТРОЙКИ БОТА ====================
// Все секретные/личные данные теперь берутся из файла .env (см. .env.example)
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID);
const WEB_APP_URL = process.env.WEB_APP_URL;

if (!BOT_TOKEN || !ADMIN_ID || !WEB_APP_URL) {
  console.error('❌ Заполните файл .env (см. .env.example) — не хватает переменных окружения.');
  process.exit(1);
}
// ========================================================

const bot = new Telegraf(BOT_TOKEN);

const userSessions = new Map();
const adminSession = { waitingToReplyTo: null };

// Главное меню для обычных пользователей
const mainMenu = Markup.keyboard([
  [Markup.button.webApp('📦 Каталог товаров', WEB_APP_URL)],
  ['❓ Помощь']
]).resize();

function sendWelcome(ctx) {
  const userId = ctx.from.id;
  userSessions.delete(userId);
  if (userId === ADMIN_ID) adminSession.waitingToReplyTo = null;

  const welcomeMessage = `Здравствуйте! Добро пожаловать в наш интернет-магазин!

Мы рады приветствовать вас и хотим предоставить вам лучший опыт покупок. Наша цель - обеспечивать высокое качество продукции, быструю доставку и отличный сервис.

Если у вас есть какие-либо вопросы или нужна помощь в выборе товаров, пожалуйста, обращайтесь к нашим консультантам через кнопку Помощь. Мы всегда готовы помочь вам!
Если консультация не требуется то нажмите кнопку каталог товаров.

Спасибо за ваш интерес и доверие! Желаем вам приятных покупок!  С уважением, Команда D.O.S.`;

  return ctx.reply(welcomeMessage, mainMenu);
}

function sendHelpRequest(ctx) {
  userSessions.set(ctx.from.id, { waitingForSupport: true });

  return ctx.reply(
    `Пожалуйста подробно напишите Ваш вопрос или ситуацию.\n` +
    `Оставьте свой телефон и username.\n` +
    `Наш администратор свяжется с Вами в ближайшее время.`
  );
}

bot.start((ctx) => sendWelcome(ctx));
bot.hears('❓ Помощь', (ctx) => sendHelpRequest(ctx));
bot.command('help', (ctx) => sendHelpRequest(ctx));

bot.action(/^reply_to_(.+)$/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) {
    return ctx.answerCbQuery('У вас нет доступа к этой функции.');
  }

  const userIdToReply = ctx.match[1];
  adminSession.waitingToReplyTo = userIdToReply;

  await ctx.answerCbQuery();
  await ctx.reply(`Введите текст ответа для пользователя (ID: ${userIdToReply}):`);
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const messageText = ctx.message.text;

  if (messageText === '/start') return;

  // 1. ЛОГИКА АДМИНИСТРАТОРА
  if (userId === ADMIN_ID && adminSession.waitingToReplyTo) {
    const targetUserId = adminSession.waitingToReplyTo;
    
    try {
      await ctx.telegram.sendMessage(
        targetUserId, 
        `✉️ *Ответ от администратора:*\n\n${messageText}`, 
        { parse_mode: 'Markdown' }
      );
      await ctx.reply(`✅ Ответ успешно отправлен пользователю.`);
    } catch (error) {
      console.error('Ошибка отправки ответа:', error);
      await ctx.reply('❌ Не удалось отправить сообщение.');
    } finally {
      adminSession.waitingToReplyTo = null;
    }
    return;
  }

  // 2. ЛОГИКА ПОЛЬЗОВАТЕЛЯ
  const session = userSessions.get(userId);
  if (session && session.waitingForSupport) {
    try {
      const username = ctx.from.username ? `@${ctx.from.username}` : 'Не указан';
      
      const adminMessage = `🔔 *Новое обращение в поддержку!*\n\n` +
                           `👤 *От кого:* ${ctx.from.first_name}\n` +
                           `🆔 *ID:* \`${userId}\`\n` +
                           `🔗 *Username:* ${username}\n\n` +
                           `📝 *Сообщение:* ${messageText}`;

      await ctx.telegram.sendMessage(
        ADMIN_ID, 
        adminMessage, 
        { 
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            Markup.button.callback('✍️ Ответить', `reply_to_${userId}`)
          ])
        }
      );
      
      userSessions.delete(userId);
      await ctx.reply('Спасибо! Ваше сообщение успешно отправлено администратору. Ожидайте ответа.', mainMenu);
      
    } catch (error) {
      console.error('Ошибка отправки админу:', error);
      await ctx.reply('Произошла ошибка при отправке сообщения.');
    }
    return;
  }

  ctx.reply('Пожалуйста, воспользуйтесь кнопками меню ниже 👇', mainMenu);
});

// Отладка
bot.on('message', (ctx) => {
  console.log(`[ЛОГ] Сообщение от ${ctx.from.first_name}: "${ctx.message.text || '[Медиа]'}"`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGterm', () => bot.stop('SIGTERM'));

bot.launch({ dropPendingUpdates: true })
  .then(() => console.log('🚀 Бот успешно подключен напрямую и готов к работе!'))
  .catch((err) => console.error('🔴 Ошибка запуска:', err.message));
