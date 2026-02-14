#!/bin/bash

# Тестовый скрипт для проверки commitConfirmation
# Использование: ./test-commit-edit.sh

echo "🧪 Тест создания коммита (Mock Mode)"
echo "======================================================"
echo ""
echo "⌛️ Выполняем сборку..."

# Включаем mock режим
export MOCK_LLM=true

# Создаем тестовый файл
TEST_FILE="test-commit-$(date +%s).txt"
echo "Тестовое содержимое для проверки commitConfirmation" > "$TEST_FILE"

# Функция для cleanup (будет вызвана в любом случае)
cleanup() {
    echo ""
    echo "🧹 Cleanup:"
    if [ -f "$TEST_FILE" ]; then
        # Убираем из staging если был добавлен
        git reset HEAD "$TEST_FILE" 2>/dev/null
        # Удаляем файл
        rm -f "$TEST_FILE"
        echo "   ✅ Тестовый файл $TEST_FILE удален"
    fi
}

# Регистрируем cleanup на выход (любой - успех или ошибка)
trap cleanup EXIT

# Добавляем в staging
git add "$TEST_FILE"

echo "✅ Создан тестовый файл: $TEST_FILE"
echo "✅ Mock режим включен (MOCK_LLM=true)"
echo ""
echo "🎭 В mock режиме:"
echo "   - Проходит весь процесс генерации и валидации"
echo "   - Можно тестировать точечное редактирование"
echo "   - Не создается реальный git commit"
echo "   - Не отправляются реальные API запросы к LLM"
echo "   - Staged файлы остаются в staging area"
echo ""
echo "🚀 Запускаем commitizen..."
echo ""

# Запускаем commitizen
npm run commit

# Статус завершения
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Тест завершен успешно!"
else
    echo "⚠️  Тест завершился с кодом: $EXIT_CODE"
fi

# cleanup будет вызван автоматически через trap EXIT
exit $EXIT_CODE
