using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using System.Collections.Generic;

namespace Kiosk_Web.Controllers
{
  
    public class Sprzet
    {
        public string Model { get; set; }
        public string NumerSeryjny { get; set; }
        public string Status { get; set; }
    }

    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            List<Sprzet> listaSprzetu = new List<Sprzet>();

         
            string connString = "server=localhost;user=root;database=kiosk_it;port=3306;password=";

            try
            {
                using (MySqlConnection conn = new MySqlConnection(connString))
                {
                    conn.Open();
                    // Pobieramy dane z bazy MySQL 
                    string query = @"SELECT m.marka, m.nazwa_modelu, e.numer_seryjny, e.status 
                                     FROM Egzemplarze e 
                                     JOIN Modele_Sprzetu m ON e.id_modelu = m.id_modelu";

                    using (MySqlCommand cmd = new MySqlCommand(query, conn))
                    using (MySqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            listaSprzetu.Add(new Sprzet
                            {
                                Model = reader["marka"].ToString() + " " + reader["nazwa_modelu"].ToString(),
                                NumerSeryjny = reader["numer_seryjny"].ToString(),
                                Status = reader["status"].ToString()
                            });
                        }
                    }
                }
            }
            catch (System.Exception ex)
            {
                ViewBag.Error = "B³¹d bazy: Upewnij siê, ¿e XAMPP dzia³a. Szczegó³y: " + ex.Message;
            }

            
            return View(listaSprzetu);
        }
    }
}