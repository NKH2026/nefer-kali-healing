import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rwvdvobopcfzalfausxg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dmR2b2JvcGNmemFsZmF1c3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODI5NTAsImV4cCI6MjA4NDM1ODk1MH0.hRnzu2eNXouRIclI153HbjEdF7qAarwe9iDkTt2w9hI';
const supabase = createClient(supabaseUrl, supabaseKey);

const contentHtml = `
  <h1>The Ancient Power of St. John's Bush: A Caribbean Healing Tradition</h1>
  <p>In the vibrant traditions of Caribbean natural medicine, few plants hold as much reverence for women's health as <strong>St. John's Bush</strong> (<i>Justicia secunda</i>). Also known affectionately as Blood Root or Blood Bush, this powerful botanical has been a cornerstone of womb wellness for generations.</p>
  
  <h2>What is St. John's Bush?</h2>
  <p>Often confused with the European mood-supporting herb St. John's Wort, St. John's Bush is an entirely distinct tropical plant. Its characteristic deep crimson or purple brew when boiled is indicative of its rich concentration of anthocyanins and healing compounds. Culturally, it carries the fiery, transformative energy of Ọya—representing profound internal clearing and renewal.</p>

  <h2>Health Benefits of Justicia secunda</h2>
  <ul>
    <li><strong>Fibroid Support:</strong> Traditionally consumed to aid in the reduction of fibroid symptoms and promote uterine tissue health.</li>
    <li><strong>Menstrual Relief:</strong> Highly effective in alleviating severe cramping, heavy bleeding, and irregular cycles.</li>
    <li><strong>Anti-Inflammatory Properties:</strong> Beyond the womb, its potent anti-inflammatory effects benefit those with localized pain or arthritis.</li>
  </ul>

  <h2>How to Prepare St. John's Bush Tea</h2>
  <p>To craft a healing infusion:</p>
  <ol>
    <li>Gather about 2 tablespoons of dried St. John's Bush.</li>
    <li>Bring 1-2 cups of high-quality distilled or spring water to a rolling boil.</li>
    <li>Add the herbs and reduce the heat, letting it simmer gently for 15-20 minutes.</li>
    <li>Strain the dark, ruby-red liquid. You may sweeten it lightly with agave or local honey.</li>
  </ol>
  <p>For the best results, traditional practitioners recommend starting this tea two weeks before your cycle and consuming it for no more than two consecutive weeks.</p>

  <h2>Where to Buy Authentic St. John's Bush?</h2>
  <p>Finding organic, sustainably harvested Justicia secunda outside of the Caribbean can be challenging. At Nefer Kali Healing, our <a href="/offerings/st-johns-bush-tea">St. John's Bush Tea</a> is ethically sourced from St. Lucia, ensuring you receive the purest, most spiritually potent form of this sacred herb.</p>
  
  <p>If you'd like a comprehensive protocol, read our <a href="/guides/st-johns-bush-tea">Complete St. John's Bush Tea Guide</a> for details on dosages, cycle tracking, and deeper spiritual meaning.</p>
`;

async function main() {
    const postData = {
        title: "The Ancient Power of St. John's Bush: A Caribbean Healing Tradition",
        slug: "the-ancient-power-of-st-johns-bush",
        excerpt: "Discover the powerful Caribbean healing tradition of St. John's Bush (Justicia secunda) and how to support your womb health naturally.",
        content: contentHtml,
        cover_image_url: "/guides/st-johns-bush-tea-product.jpg",
        category: "Womb Health",
        author: "Y'Marii Shango Bunmi Balewa",
        published: true,
    };

    const { data, error } = await supabase
        .from('blog_posts')
        .insert([postData]);

    if (error) {
        console.error("Error inserting blog post:", error);
    } else {
        console.log("Successfully inserted blog post!", data);
    }
}

main();
