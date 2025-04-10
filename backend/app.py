from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from deep_translator import GoogleTranslator
from gtts import gTTS
import os
import speech_recognition as sr
import tempfile
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

def text_to_text(text_to_translate, target_language):
    try:
        translator = GoogleTranslator(target=target_language)
        translated_text = translator.translate(text_to_translate)
        return {
            'success': True,
            'translated_text': translated_text
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def text_to_speech(text_to_translate, target_language):
    try:
        translator = GoogleTranslator(target=target_language)
        translated_text = translator.translate(text_to_translate)
        tts = gTTS(text=translated_text, lang=target_language)
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
        tts.save(temp_file.name)
        
        return {
            'success': True,
            'translated_text': translated_text,
            'audio_path': temp_file.name
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def speech_to_text(audio_file_path, source_language='en'):
    try:
        recognizer = sr.Recognizer()
        with sr.AudioFile(audio_file_path) as source:
            audio = recognizer.record(source)
        
        text = recognizer.recognize_google(audio, language=source_language)
        return {
            'success': True,
            'text': text
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def speech_to_speech(audio_file_path, source_language, target_language):
    try:
        # First convert speech to text
        speech_result = speech_to_text(audio_file_path, source_language)
        if not speech_result['success']:
            return speech_result
        
        # Then translate and convert to speech
        text = speech_result['text']
        return text_to_speech(text, target_language)
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route("/translate", methods=['POST'])
def translate():
    try:
        if 'option' not in request.form:
            return jsonify({'error': 'Missing option parameter'}), 400
            
        option = request.form['option']
        target_language = request.form.get('language', 'en')
        
        # Handle text-based translations
        if option in ['text-to-text', 'text-to-speech']:
            if 'text' not in request.form:
                return jsonify({'error': 'Missing text parameter'}), 400
            
            text = request.form['text']
            
            if option == 'text-to-text':
                result = text_to_text(text, target_language)
                if result['success']:
                    return jsonify({'translated_text': result['translated_text']})
                return jsonify({'error': result['error']}), 500
                
            elif option == 'text-to-speech':
                result = text_to_speech(text, target_language)
                if result['success']:
                    return send_file(
                        result['audio_path'],
                        mimetype='audio/mp3',
                        as_attachment=True,
                        download_name='translation.mp3'
                    )
                return jsonify({'error': result['error']}), 500
        
        return jsonify({'error': 'Invalid option'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)