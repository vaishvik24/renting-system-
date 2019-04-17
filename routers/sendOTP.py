# -*- coding: utf-8 -*-

import smtplib
import sys

s = smtplib.SMTP('smtp.gmail.com', 587)
temp = sys.argv
temp = temp[4:]
temp_str = " ".join(temp)
s.starttls()
s.login(str(sys.argv[1]), str(sys.argv[2]))
# s.login(str(sys.argv[1]), "@asdfghjkl@")
# print(str(sys.argv[1]))
# print(str(sys.argv[2]))
# print(str(sys.argv[3]))
# print(str(sys.argv[4]))
# f = open('text.txt','w')
# f.write("temp")
# f.close()

# print(str(sys.argv[2]))
# message = 
# "hello"#"We got a request to change your DAIICT Exam Portal password.\nYour OTP to continue the process is " + str(sys.argv[2]) + ".\nIf its not you, please complain your admin about this incident to take further actions."
s.sendmail(str(sys.argv[1]),str(sys.argv[3]) , str(temp_str)) 
# s.sendmail("jamessathomfox@gmail.com", "vaishvikbrahmbhatt.1998@gmail.com" , "qwertyuioplkjhgfdsazxcvbnm" ) 
s.quit() 

