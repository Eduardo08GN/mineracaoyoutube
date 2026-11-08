import zipfile, sys
z = zipfile.ZipFile(sys.argv[1])
for i in z.infolist():
    print(i.file_size, i.filename)
    assert not i.filename.startswith(("/", "\\")) and ".." not in i.filename and ":" not in i.filename
z.extractall(sys.argv[2])
