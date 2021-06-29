### CHANGELOG 29/06/2021

**Vzdy ked nam pouzivatel da svoj email call**

POST /api/auth/register/pre

**Ak sa chce niekto pridat do sutaze (zacnu mu chodit emaily)**

POST /api/user/competition
{
    email: required
}

**Ak niekto klikne na link z emailu a v url je parameter ?te=jehoemail**

POST /api/user/track
{
    email: required,
    url: required ***url stripnut o te parameter pre prehladnost***
}

**Sem pridana nova moznost sort by emailClicksCount, filter ktory by sa mal pouzit v admine na objevenie aktivnych userov***

POST /api/admin/users
{
    sortBy:{
        emailClicksCount: 
    }
}