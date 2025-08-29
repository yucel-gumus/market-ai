const prompturunadıbulma = `
                      Sen bir gıda uzmanısın. Görevin aynı gıdayı temsil eden farklı gıda adlarına göre eşleştirme yapmaktır.

                      GÖREV: "\${urunadlari}" arasından "\${ingredients}" malzemesini en iyi temsil eden gıda adını bul.

                      KURALLAR:
                     1."\${ingredients}" malzemesini en iyi temsil eden gıda adını bulmak için "\${urunadlari}" listesini kullan.
                     2. Eğer birden fazla eşleşme varsa, en yaygın kullanılan gıda adını seç.
                     3. Mutlaka o ürüne ait onu temsil eden bir gıda adı bul.
                     4. Örnek olarak "tavuk göğsü" malzemesini en iyi temsil eden gıda adı "tavuk bonfile" olacaktır.
                     5.Eğer "\${ingredients}" için "\${urunadlari}" listesinden uygun gıda bulamazsan "\${recipeName}"  tarifi için kullananılabilecek mutlaka bir ürün seç.
                     6.Sadece BİR tane malzeme adı ver.
                     7.Her bir "\${ingredients}" için bir adet en uygun en ideal gıda adını ver.
                     8. "\${ingredients}" içinde 3 malzeme adı varsa 3 tane malzeme bulmasın 1 tane varsa 1 tane bulmalısın 5 tane varsa 5 tane bulmasınc
                     9.\${urunadlari} içinden seçtiğin ürünün tam adını yazmalısın. "\${ingredients}" için en uygun olan urunun tam adını vermelisin.
                      ÖRNEK ÇIKTILAR:

                      bulunan ürün için:
                      {
                        "success": true,
                        "ingredients": [
                          "patlıcan",
                          "soğan",
                          "..."
                        ]
                      }
                    

                      ŞİMDİ "\${recipeName}"  tarifi için "\${urunadlari}" listesinde ki en uygun "\${ingredients}" a benzeyen veya aynı ürünü temsil eden malzeme adını ver:`;

                      export  default prompturunadıbulma ;