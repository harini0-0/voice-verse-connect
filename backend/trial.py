from gtts import gTTS
import os
import speech_recognition as sr
from googletrans import Translator


translator = Translator()

def text_to_speech():
    text_to_translate= input("Enter the text:- ")
    text = translator.translate(text_to_translate, dest="ja").text
    tts = gTTS(text = text, lang="ja")
    tts.save("output.mp3")
    os.system("start output.mp3")

def text_to_text():
    text_to_translate= input("Enter the text:- ")
    text = translator.translate(text_to_translate, dest="ja").text
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
        

while True:
    print("Select an option:")
    print("1. text to speech")
    print("2. speech to text")
    print("3. speech to speech")
    print("4. text to text")
    print("5. Exit")
    
    choice = input("choice (1/2/3/4/5): ")

    if choice == '1':
        text_to_speech()
    elif choice == '2':
        speech_to_text()
    elif choice =='3':
        speech_to_speech()
    elif choice == '4':
        text_to_text()
    elif choice == '5':
        print("Exiting the program...")
        break
    else:
        print("Invalid choice. Please select a valid option.")