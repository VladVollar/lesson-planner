import fs from 'fs';
import path from 'path';
import { sendMessageToAllUsers } from './sendMessageToAllUsers.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scheduleSettingsPath = path.join(__dirname, '..', 'data', 'scheduleSettings.json');

let lastModifiedTime;
let oldSchedule = {};

const loadSchedule = () => {
    if (fs.existsSync(scheduleSettingsPath)) {
        return JSON.parse(fs.readFileSync(scheduleSettingsPath, 'utf-8'));
    }
    return {};
};

const compareSchedules = (oldSchedule, newSchedule) => {
    const changes = [];
    const weekdays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

    weekdays.forEach(day => {
        const oldDaySchedule = oldSchedule[day] || {};
        const newDaySchedule = newSchedule[day] || {};

        for (const slot in newDaySchedule) {
            if (!oldDaySchedule[slot]) {
                changes.push(`<b>Добавлено:</b> ${day}, ${slot} - ${newDaySchedule[slot]}`);
            } else if (oldDaySchedule[slot] !== newDaySchedule[slot]) {
                changes.push(`<b>Изменено:</b> ${day}, ${slot} - ${newDaySchedule[slot]}`);
            }
        }

        for (const slot in oldDaySchedule) {
            if (!newDaySchedule[slot]) {
                changes.push(`<b>Удалено:</b> ${day}, ${slot} - ${oldDaySchedule[slot]}`);
            }
        }
    });

    return changes;
};

export function checkForScheduleChanges() {
    fs.stat(scheduleSettingsPath, (err, stats) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        const currentModifiedTime = stats.mtime;

        if (!lastModifiedTime || currentModifiedTime > lastModifiedTime) {
            lastModifiedTime = currentModifiedTime;
            const newSchedule = loadSchedule();
            const changes = compareSchedules(oldSchedule, newSchedule);
            oldSchedule = newSchedule;

            if (changes.length > 0) {
                sendMessageToAllUsers(`Расписание было обновлено:\n${changes.join('\n')}`, { parse_mode: 'HTML', disable_web_page_preview: true });
            }
        }
    });
}

fs.stat(scheduleSettingsPath, (err, stats) => {
    if (err) {
        console.error('Error initializing file modification time:', err);
        return;
    }
    lastModifiedTime = stats.mtime;
    oldSchedule = loadSchedule();
});