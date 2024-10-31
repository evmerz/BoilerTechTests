import json
import uuid
from pathlib import Path
import os

def generate_quiz_id(index):
  print("Generating new ID for quiz \"" + quizzes[i]["quizInfo"]["quizName"] + "\"")
  quizzes[index]["quizInfo"]["quizID"] = str(uuid.uuid4())
  update_quiz_file(index)

def generate_question_id(quiz_index, question_index):
  quizzes[quiz_index]["questions"][question_index]["questionID"] = str(uuid.uuid4())

def update_quiz_file(index):
  with open(quiz_file_names[index], 'w', encoding='utf-8') as f:
    json.dump(quizzes[index], f, ensure_ascii=False, indent=2)

quizzes = []
quiz_file_names = []

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
  if (quizzes[i]["quizInfo"]["quizID"] == ""):
    generate_quiz_id(i)
    
  for k in range(i + 1, len(quizzes)):
    
    if ((quizzes[k]["quizInfo"]["quizID"] == '') or (quizzes[i]["quizInfo"]["quizID"] == quizzes[k]["quizInfo"]["quizID"])):
      generate_quiz_id(k)

