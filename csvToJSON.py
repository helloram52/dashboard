import csv
import json


def isFloat(num):
	try:
	   val = float(num)
	except ValueError:
	   return False
	return True

def isNumber(num):
	try:
	   val = int(num)
	except ValueError:
	   return isFloat(num)
	return True


csvfile = open('Suman test2.csv', 'r')
jsonfile = open('data_new.json', 'w')

#assuming first record as header
csvHandler=csv.reader(csvfile)
fieldNames=csvHandler.next()

reader = csv.DictReader( csvfile, fieldNames)

output = []

for each in reader:
	row = {}
	for field in fieldNames:
		if isNumber(each[field]):
			row[field] = int(each[field])
		else:
			row[field] = each[field]
	output.append(row)

json.dump(output, jsonfile, indent=0, sort_keys=False)