import json
import uuid
from pathlib import Path
import os

def generate_quiz_id(directoryIndex, jsonIndex):
  print("Generating new ID for quiz \"" + quizzes[jsonIndex]["quizInfo"]["quizName"] + "\"")
  quizID = ""
  existingID = True

  # Ensures there are no existing quizzes with this ID
  while (existingID):
    quizID = str(uuid.uuid4())
    existingID = False
    for i in range(0, len(quiz_directory["quizzes"])):
      if (quiz_directory["quizzes"][i]["quizID"] == quizID):
        existingID = True
        break
  
  quiz_directory["quizzes"][directoryIndex]["quizID"] = quizID
  update_quiz_directory()

def generate_question_id(quiz_index, question_index):
  quizzes[quiz_index]["questions"][question_index]["questionID"] = str(uuid.uuid4())

def update_quiz_file(index):
  with open(quiz_file_names[index], 'w', encoding='utf-8') as f:
    json.dump(quizzes[index], f, ensure_ascii=False, indent=2)

def update_quiz_directory():
  with open('frontend/content/quiz_data.json', 'w', encoding='utf-8') as f:
    json.dump(quiz_directory, f, ensure_ascii=False, indent=2)

quizzes = []
quiz_file_names = []

# Load the directory listing of all JSON quiz files
with open('frontend/content/quiz_data.json') as user_file:
  quiz_directory = json.load(user_file)

# Load all JSON files in quizzes directory
index = 0
for p in Path('frontend/content/quizzes/').glob('*.json'):
  with open(p) as user_file:
    parsed_json = json.load(user_file)
  
  print("found file " + parsed_json["quizInfo"]["quizName"])
  quizzes.append(parsed_json)
  quiz_file_names.append(p)

  # Ensure there are no duplicate or blank question IDs in a single quiz
  file_write = False
  for i in range(0, len(parsed_json["questions"])):
    if (parsed_json["questions"][i]["questionID"] == ""):
      generate_question_id(index, i)
      file_write = True

    for k in range(i + 1, len(parsed_json["questions"])):
      if ((parsed_json["questions"][k]["questionID"] == "") or (parsed_json["questions"][i]["questionID"] == parsed_json["questions"][k]["questionID"])):
        generate_question_id(index, k)
        file_write = True

  if (file_write == True):
    update_quiz_file(index)

  index += 1
    
# Ensure there are no duplicate or blank quiz IDs
for i in range(0, len(quizzes)):

  quiz_found = False
  for k in range(0, len(quiz_directory["quizzes"])):
    if ("/" + str(quiz_file_names[i]) == quiz_directory["quizzes"][k]["filePath"]):
      quiz_found = True
      if (quiz_directory["quizzes"][k]["quizID"] == ""):
        generate_quiz_id(k, i)
      break

  if (quiz_found == False):
    listing = {"quizID": "", "filePath": "/" + str(quiz_file_names[i])}
    quiz_directory["quizzes"].append(listing)
    print("aaaaaaaaaaaaaaaaaa")
    generate_quiz_id(len(quiz_directory["quizzes"]) - 1, i)