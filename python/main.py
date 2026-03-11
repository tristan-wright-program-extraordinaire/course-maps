import flask
from google.cloud import storage
import json
import gmplot
import requests

apikey = '*****PROPRIETARY INFO *****'


BUCKET_NAME = "course-maps-bucket"
JSON_FILE = "data/course_locations.json"

storage_client = storage.Client()

def get_bucket():
    return storage_client.bucket(BUCKET_NAME)

def hello_http(request):
    path = request.path

    print(path)

    if path == "/":
        return flask.render_template("index.html")
    elif path.startswith("/update-data"):
        update_course_info()

        print("Update Data")
        return "OK", 200
    elif path.startswith("/app/data"):
        bucket = get_bucket()
        blob = bucket.blob(JSON_FILE)

        if not blob.exists():
            return {}

        data = json.loads(blob.download_as_text())
        return data

    return 'Something went wrong :('


def update_course_info():
    brokenArray = []
    delicateCourses = []

    bucket = get_bucket()
    blob = bucket.blob(JSON_FILE)

    if not blob.exists():
        return {}

    originalCourseObject = json.loads(blob.download_as_text())

    response = requests.get("*****PROPRIETARY INFO *****")
    importFile = response.json()["data"]

    active_ids = [potential_course["id"] for potential_course in importFile]
    courseObject = {k: v for k, v in originalCourseObject.items() if k in active_ids}

    # postRemovalLength = len(originalCourseObject) - len(courseObject)

    for i,potential_course in enumerate(importFile):
        skipThis = False
        if (potential_course["Products1"]) == None:
            continue
        try:
            includeGroup = int(str(potential_course["Group"]).replace("G",""))
            thisGroup = str(potential_course["Group"])
        except ValueError:
            includeGroup = False
            thisGroup = None
        currentCourseObj = {
            "name": str(potential_course["Account_Name"]),
            "products": str("; ".join(potential_course["Products1"])),
            "rounds": potential_course["Rounds_Number"],
            "contact": str(potential_course["Course_Pro"]["name"]) if potential_course["Course_Pro"] else "N/A",
            "restrictions": str("; ".join(potential_course["Restrictions"])) if str(potential_course["Restrictions"]) != "None" else "None",
            "timezone": str(potential_course["Time_Zone"]),
            "street": str(potential_course["Shipping_Street"]),
            "city": str(potential_course["Shipping_City"]),
            "state": str(potential_course["Shipping_State"]),
            "zip": str(potential_course["Shipping_Code"]),
            "tags": str("; ".join([x["name"] for x in potential_course["Tag"]])) if str(potential_course["Tag"]) != "None" else "None",
            "url": f'https://www.google.com/maps/search/{potential_course["Account_Name"].replace(" ","+")}+{str(potential_course["Shipping_Code"])}',
            "zoho_url": f'*****PROPRIETARY INFO *****',
            "course_id": str(potential_course["id"]),
            "group": thisGroup
        }

        street = currentCourseObj["street"]
        city = currentCourseObj["city"]
        state = currentCourseObj["state"]
        zip_code = currentCourseObj["zip"]
        address = (f"{street}, {city}, {state}, {zip_code}").replace("#"," ")

        id = currentCourseObj["course_id"]

        if not includeGroup:
            delicateCourses.append(str(currentCourseObj["group"]))

        if not id in courseObject:
            try:
                location = gmplot.GoogleMapPlotter.geocode(address, apikey=apikey)
                currentCourseObj["location"] = {"lat": location[0],"lng":location[1]}
            except:
                skipThis = True
                print(address)
                brokenArray.append(id)
        else:
            old_address = f'{courseObject[id]["street"]}, {courseObject[id]["city"]}, {courseObject[id]["state"]}, {courseObject[id]["zip"]}'
            if old_address != address:
                try:
                    location = gmplot.GoogleMapPlotter.geocode(address, apikey=apikey)
                    currentCourseObj["location"] = {"lat": location[0],"lng":location[1]}
                except:
                    skipThis = True
                    print(address)
                    brokenArray.append(id)
            else:
                currentCourseObj["location"] = courseObject[id]["location"]

        if not skipThis:
            courseObject[id] = currentCourseObj

    print(brokenArray)

    with open("testfile.txt","w") as writeFile:
        writeFile.write(str(delicateCourses))

    # blob.upload_from_string(
    #     json.dumps(courseObject),
    #     content_type="application/json"
    # )



def update_course_info():
    brokenArray = []

    with open("course-maps-update-v2.json","r") as jsonFile:
        originalCourseObject = json.loads(jsonFile.read())

    # originalCourseObject = json.loads(blob.download_as_text())

    response = requests.get("*****PROPRIETARY INFO *****")
    importFile = response.json()["data"]

    active_ids = [potential_course["id"] for potential_course in importFile]
    courseObject = {k: v for k, v in originalCourseObject.items() if k in active_ids}

    postRemovalLength = len(originalCourseObject) - len(courseObject)

    for i,potential_course in enumerate(importFile):
        skipThis = False
        if (potential_course["Products1"]) == None:
            continue
        try:
            includeGroup = int(str(potential_course["Group"]).replace("G",""))
            thisGroup = str(potential_course["Group"])
        except ValueError:
            thisGroup = "None"
        currentCourseObj = {
            "name": str(potential_course["Account_Name"]),
            "products": str("; ".join(potential_course["Products1"])),
            "rounds": potential_course["Rounds_Number"],
            "contact": str(potential_course["Course_Pro"]["name"]) if potential_course["Course_Pro"] else "N/A",
            "restrictions": str("; ".join(potential_course["Restrictions"])) if str(potential_course["Restrictions"]) != "None" else "None",
            "timezone": str(potential_course["Time_Zone"]),
            "street": str(potential_course["Shipping_Street"]),
            "city": str(potential_course["Shipping_City"]),
            "state": str(potential_course["Shipping_State"]),
            "zip": str(potential_course["Shipping_Code"]),
            "tags": str("; ".join([x["name"] for x in potential_course["Tag"]])) if str(potential_course["Tag"]) != "None" else "None",
            "url": f'https://www.google.com/maps/search/{potential_course["Account_Name"].replace(" ","+")}+{str(potential_course["Shipping_Code"])}',
            "zoho_url": f'https://crm.zoho.com/crm/org658286422/tab/Accounts/{str(potential_course["id"])}',
            "course_id": str(potential_course["id"]),
            "group": thisGroup,
            "super_push": str(potential_course["super_push"]),
            "kiosk_ready": str(potential_course["kiosk_ready"])
        }
        name = currentCourseObj["name"]
        street = currentCourseObj["street"]
        city = currentCourseObj["city"]
        state = currentCourseObj["state"]
        zip_code = currentCourseObj["zip"]
        address = (f"{name} {street}, {city}, {state}, {zip_code}").replace("#"," ")

        id = currentCourseObj["course_id"]

        if not id in courseObject:
            try:
                location = gmplot.GoogleMapPlotter.geocode(address, apikey=apikey)
                currentCourseObj["location"] = {"lat": location[0],"lng":location[1]}
            except:
                skipThis = True
                print(address)
                brokenArray.append(id)
        else:
            old_address = f'{courseObject[id]["street"]}, {courseObject[id]["city"]}, {courseObject[id]["state"]}, {courseObject[id]["zip"]}'
            if old_address != address:
                try:
                    location = gmplot.GoogleMapPlotter.geocode(address, apikey=apikey)
                    currentCourseObj["location"] = {"lat": location[0],"lng":location[1]}
                except:
                    skipThis = True
                    print(address)
                    brokenArray.append(id)
            else:
                currentCourseObj["location"] = courseObject[id]["location"]

        if not skipThis:
            courseObject[id] = currentCourseObj

    print(brokenArray)

    with open("course-maps-update-v2.json","w") as jsonFile:
        jsonFile.write(json.dumps(courseObject))

    # blob.upload_from_string(
    #     json.dumps(courseObject),
    #     content_type="application/json"
    # )

update_course_info()
