from decimal import Decimal
from pathlib import Path
import json

def calculate():
 principal=Decimal('10000000');rate=Decimal('.05');years=Decimal('1');portfolio=Decimal('20000000')
 interest=principal*rate*years
 # Independent ordinary-arithmetic check, no compounding or amortization.
 assert int(interest)==10000000*5//100
 return dict(currency='USD',principal=int(principal),simple_annual_rate=float(rate),years=int(years),annual_interest=int(interest),principal_end=int(principal),total_due_after_one_unpaid_year=int(principal+interest),initial_portfolio=int(portfolio),initial_loan_to_value=float(principal/portfolio),illustrative_growth_value=26000000,illustrative_crash_value=12000000,final_principal_to_value=float(principal/Decimal(12000000)),assumptions='Hypothetical simple annual interest, one year, no fees, payments, added borrowing or compounding. Principal remains $10M; total owed after an unpaid year is $10.5M. Chart labels principal only, not total liability, and its illustrative prices have no specified time horizon. Asset values are not forecasts. No lender eligibility or universal loan limit implied.')

if __name__=='__main__':
 r=calculate();Path(__file__).with_name('calculation-results.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
