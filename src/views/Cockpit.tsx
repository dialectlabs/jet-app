import { useEffect, useState } from 'react';
import { useInitFailed } from '../contexts/init';
import { useGeoban, useLanguage } from '../contexts/localization/localization';
import { useAlert } from '../contexts/copilotModal';
import { cluster, useMargin } from '../contexts/marginContext';
import { currencyFormatter, totalAbbrev } from '../utils/currency';
import { InitFailed } from '../components/InitFailed';
import { Info } from '../components/Info';
import { HealthBar } from '../components/HealthBar';
import { TradePanel } from '../components/TradePanel';
import { MarketTable } from '../components/MarketTable';
import { Checkbox } from 'antd';
import { EthNotification } from '../components/EthNotification';

// Jet V1
import { useUser } from '../v1/contexts/user';
import { useMarket } from '../v1/contexts/market';

export function Cockpit(): JSX.Element {
  const isGeobanned = useGeoban();
  const { dictionary } = useLanguage();
  const { initFailed } = useInitFailed();
  const { setAlert } = useAlert();

  // Jet V1
  const userV1 = useUser();
  const market = useMarket();

  // Jet V2
  const { config, programs, poolsFetched, pools, marginAccount, walletBalances, userFetched } = useMargin();

  // If user has not accepted disclaimer, alert them to accept
  const acceptedDisclaimer = localStorage.getItem('jetDisclaimerAccepted') === 'true';
  const [dislaimerChecked, setDisclaimerChecked] = useState(false);
  useEffect(() => {
    if (cluster === 'mainnet-beta' && !acceptedDisclaimer) {
      setAlert({
        status: 'failure',
        overview: dictionary.copilot.alert.warning,
        detail: (
          <span>
            {dictionary.copilot.alert.disclaimer}
            <br />
            <br />
            <a href="https://www.jetprotocol.io/legal/terms-of-service" target="_blank" rel="noopener noreferrer">
              <span className="gradient-text link-btn">{dictionary.termsPrivacy.termsOfService}</span>
            </a>
            &nbsp;&nbsp;
            <a href="https://www.jetprotocol.io/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
              <span className="gradient-text link-btn">{dictionary.termsPrivacy.privacyPolicy}</span>
            </a>
            <br />
            <br />
            <Checkbox onChange={e => setDisclaimerChecked(e.target.checked)}>
              {dictionary.copilot.alert.acceptDisclaimer}
            </Checkbox>
          </span>
        ),
        closeable: false,
        action: {
          text: dictionary.copilot.alert.accept,
          onClick: () => localStorage.setItem('jetDisclaimerAccepted', 'true'),
          disabled: !dislaimerChecked
        }
      });
    }
  }, [acceptedDisclaimer, setAlert, dictionary, dislaimerChecked]);

  if (initFailed || isGeobanned) {
    return <InitFailed />;
  } else {
    return (
      <div className="cockpit view flex justify-center column">
        <div className="cockpit-top flex align-center justify-between">
          <div className="trade-market-tvl flex align-start justify-center column">
            <h2 className="view-subheader">{dictionary.cockpit.totalSupply}</h2>
            <h1 className={`view-header ${market.marketInit ? 'gradient-text' : ''}`}>
              {market.marketInit ? totalAbbrev(market.totalSupply) : '--'}
            </h1>
          </div>
          <div className="trade-market-tvl flex align-start justify-center column">
            <h2 className="view-subheader">{dictionary.reserveDetail.totalBorrowed}</h2>
            <h1 className={`view-header ${market.marketInit ? 'gradient-text' : ''}`}>
              {market.marketInit ? totalAbbrev(market.totalBorrowed) : '--'}
            </h1>
          </div>
          <div className="trade-position-snapshot flex-centered">
            <div className="trade-position-ratio flex align-start justify-center column">
              <div className="flex-centered">
                <h2 className="view-subheader">{dictionary.cockpit.yourRatio}</h2>
                <Info term="collateralizationRatio" />
              </div>
              {userFetched ? (
                <>
                  <h1
                    className={`view-header
                    ${
                      !userV1.position.borrowedValue || userV1.position.colRatio >= market.minColRatio + 0.25
                        ? 'success-text'
                        : userV1.position.colRatio <= market.minColRatio + 0.1
                        ? 'danger-text'
                        : 'warning-text'
                    }`}
                    style={{ pointerEvents: 'none', fontSize: !userV1.position.borrowedValue ? '125px' : '' }}>
                    {userV1.position.borrowedValue > 0
                      ? userV1.position.colRatio > 10
                        ? '>1000'
                        : currencyFormatter(userV1.position.colRatio * 100, false, 1)
                      : '∞'}
                    {userV1.position.borrowedValue > 0 && (
                      <span style={{ color: 'inherit', paddingLeft: '2px' }}>%</span>
                    )}
                  </h1>
                  <HealthBar />
                </>
              ) : (
                <p>--</p>
              )}
            </div>
            <div className="flex-centered column">
              <div className="trade-position-value flex-centered column">
                <h2 className="view-subheader">{dictionary.cockpit.totalDepositedValue}</h2>
                {userFetched ? (
                  <p className="gradient-text">{currencyFormatter(userV1.position.depositedValue, true)}</p>
                ) : (
                  <p>--</p>
                )}
              </div>
              <div className="trade-position-value flex-centered column">
                <h2 className="view-subheader">{dictionary.cockpit.totalBorrowedValue}</h2>
                {userFetched ? (
                  <p className="gradient-text">{currencyFormatter(userV1.position.borrowedValue, true)}</p>
                ) : (
                  <p>--</p>
                )}
              </div>
              {userFetched && (
                <div className="trade-position-value min-c-note flex align-start justify-center">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>
                    {dictionary.cockpit.minColRatioNote.replace('{{MIN_COL_RATIO}}', market.minColRatio * 100)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="trade-table-container">
          <TradePanel />
          <MarketTable />
          {userV1.collateralBalances['ETH'] > 0 || userV1.loanBalances['ETH'] > 0 ? <EthNotification /> : null}
        </div>
      </div>
    );
  }
}
