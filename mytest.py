import zipfile
import lxml.etree as ET
from dwml.omml import oMath2Latex

repl = "{0}"

OMML_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/math}"

# docx_xml_path = "/data/wordscape_v2/test/document.xml"
# docx_xml_path = "document2.xml"

# with open(docx_xml_path, "rb") as xml_file:
#     xml = xml_file.read()

# docx_filename = "/data/wordscape_v2/000000000000000000000000/download/CC-MAIN-2016-50/doc_equation.docx"
docx_filename = "equation.docx"
zf = zipfile.ZipFile(docx_filename, mode="a")
xml = zf.open("word/document.xml").read()

# print(xml)
root = ET.fromstring(xml)
# print(root)
# print(root.tag)
# print(root.find("*"))
counter = 0
for child in root.iter():
    if "MathPara" not in child.tag:
        continue
    for child2 in child:
        if "Math" not in child2.tag:
            continue
        counter += 1
        # if counter not in [4, 5]:
        #     continue
        print(str(oMath2Latex(child2)))
        # print(child2.tag)
# for omath in root.findall("*Math*"):
# print(omath.tag)
# for omath2 in omath.findall("*"):
#     print(omath2.tag)
#     for omath3 in omath2.findall("*"):
#         print(omath3.tag)
#         if "oMath" in omath3.tag:
#             print(oMath2Latex(omath3))
#             for omath4 in omath3.findall("*"):
#                 if "oMath" in omath4.tag:
#                     # print(omath4.to_string())
#                     print(oMath2Latex(omath4))
#                     print(ET.tostring(omath4))

# print()
# print()

# print(DOCXML_ROOT.format(xml.group(0)))
# print(omath_re.groups)
# for x in omml.load_string(xml):
#     print(x)

# t = omath_re.sub(lambda m: _latex_fn(m, repl), xml)

# print(t)
