from flask import Flask, request, url_for, redirect, render_template
from googletrans import Translator
from gtts import gTTS
import os
import speech_recognition as sr

app = Flask(__name__)
translator = Translator()


# 1 - text to text, 2 - speech to speech, 3 - text to speech, 4 - speech to speech


def text_to_speech(text_to_translate, selected_language):
    # text_to_translate= input("Enter the text:- ")
    text = translator.translate(text_to_translate, dest="ja").text
    tts = gTTS(text = text, lang=selected_language)
    tts.save("output.mp3")
    os.system("start output.mp3")

def text_to_text(text_to_translate, selected_language):
    # text_to_translate= input("Enter the text:- ")
    text = translator.translate(text_to_translate, dest=selected_language).text
    print(text)

def speech_to_text():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Speak...")
        recognizer.adjust_for_ambient_noise(source, duration=0.2)
        audio = recognizer.listen(source)

    try:
        print("Recognizing...")
        text = recognizer.recognize_google(audio, language='it')
        print(f"You said: {text}")
    except sr.UnknownValueError:
        print("Sorry, could not understand audio.")
    except sr.RequestError as e:
        print(f"Error: {e}")

def speech_to_speech():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Speak...")
        recognizer.adjust_for_ambient_noise(source, duration=0.2)
        audio = recognizer.listen(source)

    try:
        print("Recognizing...")
        text = recognizer.recognize_google(audio, language='it')
        print(f"You said: {text}")
        text_to_translate= text
        text = translator.translate(text_to_translate, dest="it").text
        print(text)
        text = translator.translate(text, dest="ja").text
        tts = gTTS(text = text, lang="ja")
        tts.save("output.mp3")
        os.system("start output.mp3")
    except sr.UnknownValueError:
        print("Sorry, could not understand audio.")
    except sr.RequestError as e:
        print(f"Error: {e}")
        

@app.route("/", methods=['POST', 'GET'])
def home():
    if request.method == 'POST':
        try:
            text_to_translate = request.form["text-to-translate"].lower()
            selected_language = request.form["select-language"]
            translation_option = request.form["translation-option"]
            if translation_option == '1':
                text_to_speech(text_to_translate, selected_language)
            elif translation_option == '2':
                speech_to_text()
            elif translation_option == '3':
                speech_to_speech()
            elif translation_option == '4':
                text_to_text(text_to_translate, selected_language)
            else:
                print("Invalid choice. Please select a valid option.")
        except:
            text = "{ERROR: We are not able to handle your request right now}"
        return render_template('index.html', translation_result="text")
    return render_template("index.html")


@app.route("/team")
def team():
    return render_template("team.html")


if __name__ == "__main__":
    app.run("0.0.0.0", debug=True)
