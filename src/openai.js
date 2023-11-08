import { OpenAI } from 'openai'
// import config from 'config'
import { readFileSync } from 'fs'
import fetch from 'node-fetch' // Для выполнения HTTP-запросов
import { log } from 'console'
import dotenv from 'dotenv'

class OpenAIWrap {
	roles = {
		ASSISTANT: 'assistant',
		USER: 'user',
		SYSTEM: 'system',
	}

	constructor(apiKey) {
		// this.openai = new OpenAI({ apiKey: apiKey })
		// this.witToken = config.get('WIT_AI_TOKEN') // Убедитесь, что токен добавлен в конфигурационный файл
		this.openai = new OpenAI({ apiKey: process.env.OPENAI_KEY })
		this.witToken = process.env.WIT_AI_TOKEN
	}

	async chat(messages) {
		// Ваш существующий метод для чата
		try {
			const response = await this.openai.chat.completions.create({
				messages,
				model: 'gpt-3.5-turbo',
			})
			return response.choices[0].message
		} catch (e) {
			console.log('Error while transcription', e.message)
		}
	}

	async transcription(filepath) {
		try {
			// Читаем локальный аудиофайл
			const fileBuffer = readFileSync(filepath)

			// Отправляем аудиофайл на сервер Wit.ai и получаем транскрипцию
			const response = await fetch('https://api.wit.ai/speech', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.witToken}`,
					'Content-Type': 'audio/mpeg3', // Используйте правильный MIME тип для вашего аудиофайла
					'Transfer-Encoding': 'chunked', // Для потоковой передачи данных
				},
				body: fileBuffer, // Отправляем буфер напрямую, без преобразования в base64
			})

			// Проверяем, что ответ сервера в порядке
			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`HTTP Error: ${response.status} - ${errorText}`)
			}

			// Логируем тело ответа для отладки
			const responseBody = await response.text()
			// log('Response Body:', responseBody)
			// Convert the string into a valid JSON format
			const jsonFormat =
				'[' + responseBody.trim().replace(/\}\s*\{/g, '},{') + ']'

			// Parse the JSON format string into an object
			const dataObjects = JSON.parse(jsonFormat)
			const text = dataObjects[dataObjects.length - 1].text
			return text
		} catch (e) {
			log('Error while transcription', e.message)
		}

		log('TEXT: ', finalTranscription)
	}
}

// export const openai = new OpenAIWrap(config.get('OPENAI_KEY'))
export const openai = new OpenAIWrap(process.env.OPENAI_KEY)
